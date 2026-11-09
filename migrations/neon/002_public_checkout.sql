-- Neon migration: anonymous checkout with server-side validation, store/hour throttling,
-- authoritative catalog pricing, and idempotent order creation.
-- Apply only after the atomic order function and RLS policies are installed.
BEGIN;
CREATE OR REPLACE FUNCTION public.place_public_order(p_store_id text, p_order_id uuid, p_order jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
 v_item jsonb;
 v_items jsonb := '[]'::jsonb;
 v_prod public.products%rowtype;
 v_qty integer;
 v_sum_qty integer := 0;
 v_price numeric;
 v_subtotal numeric := 0;
 v_client_price numeric;
 v_delivery numeric;
 v_type text;
 v_name text;
 v_phone text;
 v_payment text;
 v_existing text;
 v_count integer;
 v_result jsonb;
BEGIN
 IF p_store_id NOT IN ('adega','tabacaria') OR p_order_id IS NULL
    OR p_order IS NULL OR jsonb_typeof(p_order) <> 'object'
    OR octet_length(p_order::text) > 16000 THEN
   RAISE EXCEPTION 'Pedido inválido.';
 END IF;
 IF coalesce(p_order->>'source','') <> 'ONLINE'
    OR coalesce(p_order->>'status','') <> 'NOVO' THEN
   RAISE EXCEPTION 'Operação não permitida para o checkout.';
 END IF;
 v_type := p_order->>'order_type';
 v_name := trim(coalesce(p_order->>'customer_name',''));
 v_phone := regexp_replace(coalesce(p_order->>'customer_phone',''),'\D','','g');
 v_payment := p_order->>'payment_method';
 IF v_type NOT IN ('DELIVERY','RETIRADA')
    OR length(v_name) NOT BETWEEN 2 AND 100
    OR length(v_phone) NOT BETWEEN 10 AND 13
    OR v_payment NOT IN ('pix','card','cash') THEN
   RAISE EXCEPTION 'Dados do cliente ou pagamento inválidos.';
 END IF;
 IF jsonb_typeof(p_order->'items') <> 'array'
    OR jsonb_array_length(p_order->'items') NOT BETWEEN 1 AND 30 THEN
   RAISE EXCEPTION 'O carrinho deve ter de 1 a 30 itens.';
 END IF;
 IF v_type='DELIVERY' AND (
   length(trim(coalesce(p_order->>'delivery_street',''))) < 3
   OR length(trim(coalesce(p_order->>'delivery_number',''))) < 1
 ) THEN
   RAISE EXCEPTION 'Informe endereço e número para entrega.';
 END IF;
 v_delivery := coalesce(nullif(p_order->>'delivery_fee','')::numeric,0);
 IF v_delivery < 0 OR v_delivery > 100
    OR (v_type='RETIRADA' AND v_delivery<>0) THEN
   RAISE EXCEPTION 'Frete inválido.';
 END IF;
 -- One lock coordinates duplicate checks and total rate limits per store.
 PERFORM pg_advisory_xact_lock(hashtextextended('order:'||p_store_id,0));
 SELECT store_id INTO v_existing FROM public.orders WHERE id=p_order_id;
 IF FOUND THEN
   IF v_existing<>p_store_id THEN RAISE EXCEPTION 'Pedido inválido.'; END IF;
   -- No PII is disclosed by replays, even if a UUID leaks.
   SELECT jsonb_build_object('order', jsonb_build_object(
     'id',o.id,'order_number',o.order_number,'created_at',o.created_at,
     'items',coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id',oi.id,'order_id',oi.order_id,'product_id',oi.product_id,
        'product_name',oi.product_name,'quantity',oi.quantity,
        'unit_price',oi.unit_price,'total_price',oi.total_price))
        FROM public.order_items oi WHERE oi.order_id=o.id),'[]'::jsonb)),
        'stock','[]'::jsonb) INTO v_result
   FROM public.orders o WHERE o.id=p_order_id;
   RETURN v_result;
 END IF;
 SELECT count(*) INTO v_count FROM public.orders
 WHERE store_id=p_store_id AND source='ONLINE'
 AND created_at>clock_timestamp()-interval '1 minute';
 IF v_count >= 20 THEN
   RAISE EXCEPTION 'Muitos pedidos simultâneos. Tente novamente em instantes.';
 END IF;
 SELECT count(*) INTO v_count FROM public.orders
 WHERE store_id=p_store_id AND source='ONLINE'
 AND customer_phone=v_phone
 AND created_at>clock_timestamp()-interval '1 hour';
 IF v_count >= 5 THEN
   RAISE EXCEPTION 'Limite de pedidos atingido para este contato. Tente mais tarde.';
 END IF;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_order->'items') LOOP
   IF jsonb_typeof(v_item)<>'object'
      OR coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR coalesce(v_item->>'quantity','') !~ '^[0-9]+$'
   THEN RAISE EXCEPTION 'Item inválido.'; END IF;
   v_qty := (v_item->>'quantity')::integer;
   v_sum_qty := v_sum_qty+v_qty;
   IF v_qty NOT BETWEEN 1 AND 20 OR v_sum_qty > 40
     THEN RAISE EXCEPTION 'Quantidade acima do limite.'; END IF;
   SELECT * INTO v_prod FROM public.products
    WHERE id=(v_item->>'product_id')::uuid AND store_id=p_store_id FOR UPDATE;
   IF NOT FOUND OR v_prod.is_active IS DISTINCT FROM true
     THEN RAISE EXCEPTION 'Produto indisponível.'; END IF;
   v_price := CASE WHEN v_prod.promotional_price > 0
         THEN v_prod.promotional_price ELSE v_prod.price END;
   -- The wholesale threshold applies to aggregated quantities of the same product.
   IF v_prod.wholesale_price > 0 AND v_prod.wholesale_min_quantity > 0
     AND (SELECT coalesce(sum((it->>'quantity')::integer),0)
          FROM jsonb_array_elements(p_order->'items') it
          WHERE it->>'product_id' = v_prod.id::text) >= v_prod.wholesale_min_quantity
     THEN v_price := least(v_price,v_prod.wholesale_price); END IF;
   IF v_price IS NULL OR v_price<0 THEN RAISE EXCEPTION 'Preço inválido.'; END IF;
   v_client_price := nullif(v_item->>'unit_price','')::numeric;
   IF v_client_price IS NULL OR abs(v_client_price-v_price)>0.011
     THEN RAISE EXCEPTION 'Preço atualizado. Recarregue o carrinho.'; END IF;
   IF v_prod.stock_quantity IS NOT NULL AND v_prod.stock_quantity<v_qty
     THEN RAISE EXCEPTION 'Produto sem estoque suficiente.'; END IF;
   v_subtotal := v_subtotal+round(v_price*v_qty,2);
   v_items := v_items || jsonb_build_array(jsonb_build_object(
     'product_id',v_prod.id::text,'product_name',v_prod.name,
     'quantity',v_qty,'unit_price',v_price));
 END LOOP;
 IF v_subtotal>3000 THEN RAISE EXCEPTION 'Valor máximo excedido.'; END IF;
 v_result := public.save_order_atomic(p_store_id,p_order_id,'create',
    jsonb_build_object(
      'source','ONLINE','status','NOVO','order_type',v_type,
      'customer_name',v_name,'customer_phone',v_phone,
      'delivery_cep',left(coalesce(p_order->>'delivery_cep',''),10),
      'delivery_street',left(coalesce(p_order->>'delivery_street',''),120),
      'delivery_number',left(coalesce(p_order->>'delivery_number',''),15),
      'delivery_complement',left(coalesce(p_order->>'delivery_complement',''),120),
      'delivery_neighborhood',left(coalesce(p_order->>'delivery_neighborhood',''),100),
      'delivery_city',left(coalesce(p_order->>'delivery_city',''),100),
      'delivery_state',left(coalesce(p_order->>'delivery_state',''),2),
      'payment_method',v_payment,'payment_status','PENDENTE',
      'change_for',p_order->'change_for',
      'delivery_fee',v_delivery,'discount',0,
      'items',v_items),null);
 RETURN v_result;
END;
$function$
;
REVOKE ALL ON FUNCTION public.place_public_order(text,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_public_order(text,uuid,jsonb) TO anonymous, authenticated;
COMMIT;
