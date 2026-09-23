-- Reliability only: SECURITY INVOKER preserves the existing access model.
-- Auth/RLS rollout is intentionally separate. Deploy before the frontend.
create or replace function public.save_order_atomic(
  p_store_id text, p_order_id uuid, p_action text,
  p_order jsonb default '{}'::jsonb, p_expected_updated_at timestamptz default null
) returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_old public.orders%rowtype;
  v_order public.orders%rowtype;
  v_patch jsonb;
  v_old_items jsonb := '[]'::jsonb;
  v_items jsonb;
  v_item jsonb;
  v_delta record;
  v_product public.products%rowtype;
  v_subtotal numeric := 0;
  v_quantity numeric;
  v_price numeric;
  v_total numeric;
  v_stock jsonb := '[]'::jsonb;
begin
  if p_store_id not in ('adega','tabacaria') or p_store_id is null
     or p_order_id is null or p_action not in ('create','update','status') or p_action is null then
    raise exception 'Operação de pedido inválida.';
  end if;
  -- Serialize order numbers and mutations within each store; product row locks
  -- also protect against concurrent product updates from other transactions.
  perform pg_advisory_xact_lock(hashtextextended('order:' || p_store_id, 0));
  select * into v_old from public.orders where id = p_order_id for update;
  if found then
    if v_old.store_id <> p_store_id then raise exception 'Pedido não pertence à loja.'; end if;
    select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at, i.id), '[]'::jsonb)
      into v_old_items from public.order_items i where order_id = p_order_id;
    if p_action = 'create' then
      -- Retrying the same client UUID must never debit stock twice.
      select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'stock_quantity',p.stock_quantity)),'[]'::jsonb)
        into v_stock from public.products p where p.store_id=p_store_id and p.id::text in
          (select value->>'product_id' from jsonb_array_elements(v_old_items));
      return jsonb_build_object('order',to_jsonb(v_old) || jsonb_build_object('items',v_old_items),'stock',v_stock);
    end if;
    if p_expected_updated_at is null or v_old.updated_at <> p_expected_updated_at then
      raise exception 'Este pedido foi alterado em outro dispositivo. Atualize a lista antes de tentar novamente.';
    end if;
  elsif p_action <> 'create' then
    raise exception 'Pedido não encontrado.';
  end if;

  -- Only explicitly supported commercial fields may be supplied by the client.
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into v_patch
  from jsonb_each(p_order) where key = any(array[
    'customer_id','customer_name','customer_phone','delivery_cep','delivery_street',
    'delivery_number','delivery_complement','delivery_neighborhood','delivery_city',
    'delivery_state','payment_method','payment_status','amount_received','change_for',
    'delivery_fee','discount','notes','order_type'
  ]);
  if p_action = 'create' then
    v_order := jsonb_populate_record(null::public.orders,
      jsonb_build_object('id',p_order_id,'store_id',p_store_id,'source','INTERNO',
        'status','NOVO','order_type','BALCAO','payment_status','PENDENTE',
        'delivery_fee',0,'discount',0,'created_at',clock_timestamp(),'updated_at',clock_timestamp())
      || v_patch || jsonb_build_object('source',coalesce(p_order->>'source','INTERNO')));
    select coalesce(max(order_number),0)+1 into v_order.order_number
      from public.orders where store_id = p_store_id;
  else
    v_order := v_old;
    if p_action = 'update' then
      v_order := jsonb_populate_record(v_order, v_patch);
    end if;
    if p_order ? 'status' then v_order.status := (p_order->>'status')::public.order_status; end if;
    if v_old.status = 'CANCELADO' and v_order.status <> 'CANCELADO' then
      raise exception 'Um pedido cancelado não pode ser reaberto. Crie um novo pedido.';
    end if;
    v_order.updated_at := clock_timestamp();
  end if;
  if v_order.status is null then raise exception 'Status inválido.'; end if;
  v_items := case when p_action='status' then v_old_items
    else coalesce(p_order->'items',v_old_items) end;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'O pedido precisa ter pelo menos um item.';
  end if;
  for v_item in select value from jsonb_array_elements(v_items) loop
    v_quantity := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'unit_price')::numeric;
    if v_quantity is null or v_quantity <= 0 or v_quantity > 100000 or trunc(v_quantity) <> v_quantity
       or v_price is null or v_price < 0 or v_price > 100000000
       or nullif(trim(v_item->>'product_name'),'') is null then
      raise exception 'Quantidade, preço ou nome de item inválido.';
    end if;
    v_subtotal := v_subtotal + round(v_quantity * v_price,2);
  end loop;
  if p_action <> 'status' and (v_order.delivery_fee is null or v_order.delivery_fee < 0 or v_order.delivery_fee > 100000000
     or v_order.discount is null or v_order.discount < 0 or v_order.discount > v_subtotal) then
    raise exception 'Frete ou desconto inválido.';
  end if;
  if p_action <> 'status' then
    v_order.subtotal := v_subtotal;
    v_order.total := round(v_subtotal + v_order.delivery_fee - v_order.discount,2);
  end if;
  if p_action <> 'status' and v_order.change_for is not null and (v_order.change_for < v_order.total or v_order.change_for > 100000000) then
    raise exception 'O valor para troco deve ser maior ou igual ao total.';
  end if;
  if v_order.order_type='DELIVERY' and (nullif(trim(v_order.delivery_street),'') is null
    or nullif(trim(v_order.delivery_number),'') is null) and p_action <> 'status' then
    raise exception 'Informe o endereço e o número para entrega.';
  end if;

  -- Delta is old reserved quantity minus new reserved quantity, grouped by
  -- product (including multiple flavors). Cancellation returns it exactly once.
  for v_delta in
    select product_id, sum(qty)::integer as qty from (
      select nullif(value->>'product_id','') as product_id,
        (value->>'quantity')::integer as qty from jsonb_array_elements(v_old_items)
        where v_old.status <> 'CANCELADO'
      union all
      select nullif(value->>'product_id',''), -(value->>'quantity')::integer
        from jsonb_array_elements(v_items) where v_order.status <> 'CANCELADO'
    ) quantities where product_id is not null group by product_id order by product_id
  loop
    select * into v_product from public.products where id::text=v_delta.product_id
      and store_id=p_store_id for update;
    if not found then
      if v_delta.qty < 0 then raise exception 'Produto não encontrado nesta loja.'; end if;
      continue; -- A deleted historical product cannot be restocked.
    end if;
    if v_delta.qty < 0 and v_product.is_active = false then raise exception 'Produto indisponível: %',v_product.name; end if;
    if v_product.stock_quantity is not null then
      if v_product.stock_quantity + v_delta.qty < 0 then
        raise exception 'Estoque insuficiente: %',v_product.name;
      end if;
      update public.products set stock_quantity=stock_quantity+v_delta.qty where id=v_product.id
        returning * into v_product;
      v_stock := v_stock || jsonb_build_array(jsonb_build_object('id',v_product.id,'stock_quantity',v_product.stock_quantity));
    end if;
  end loop;

  if p_action='create' then
    insert into public.orders select (v_order).*;
  else
    if v_old.status is distinct from v_order.status then
      case v_order.status
        when 'RECEBIDO' then v_order.received_at := clock_timestamp();
        when 'EM_PREPARACAO' then v_order.preparing_at := clock_timestamp();
        when 'EM_SEPARACAO' then v_order.separating_at := clock_timestamp();
        when 'PRONTO' then v_order.ready_at := clock_timestamp();
        when 'EM_ENTREGA' then v_order.delivery_started_at := clock_timestamp();
        when 'CONCLUIDO' then v_order.completed_at := clock_timestamp();
        when 'CANCELADO' then
          v_order.cancelled_at := clock_timestamp(); v_order.cancel_reason := p_order->>'cancel_reason';
        else null;
      end case;
    end if;
    update public.orders set
      customer_id=v_order.customer_id,customer_name=v_order.customer_name,customer_phone=v_order.customer_phone,
      delivery_cep=v_order.delivery_cep,delivery_street=v_order.delivery_street,delivery_number=v_order.delivery_number,
      delivery_complement=v_order.delivery_complement,delivery_neighborhood=v_order.delivery_neighborhood,
      delivery_city=v_order.delivery_city,delivery_state=v_order.delivery_state,change_for=v_order.change_for,
      payment_method=v_order.payment_method,payment_status=v_order.payment_status,amount_received=v_order.amount_received,
      subtotal=v_order.subtotal,delivery_fee=v_order.delivery_fee,discount=v_order.discount,total=v_order.total,
      notes=v_order.notes,order_type=v_order.order_type,status=v_order.status,updated_at=v_order.updated_at,
      received_at=v_order.received_at,preparing_at=v_order.preparing_at,separating_at=v_order.separating_at,
      ready_at=v_order.ready_at,delivery_started_at=v_order.delivery_started_at,completed_at=v_order.completed_at,
      cancelled_at=v_order.cancelled_at,cancel_reason=v_order.cancel_reason
    where id=p_order_id;
  end if;
  if p_action='create' or (p_action='update' and p_order ? 'items') then
    delete from public.order_items where order_id=p_order_id;
    for v_item in select value from jsonb_array_elements(v_items) loop
      v_total := round((v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric,2);
      insert into public.order_items(order_id,product_id,product_name,quantity,unit_price,total_price,notes,options,status)
        values(p_order_id,nullif(v_item->>'product_id',''),v_item->>'product_name',
          (v_item->>'quantity')::integer,(v_item->>'unit_price')::numeric,v_total,v_item->>'notes',v_item->'options',v_item->>'status');
    end loop;
  end if;
  if p_action='create' or v_old.status is distinct from v_order.status then
    insert into public.order_status_history(order_id,store_id,from_status,to_status,notes)
      values(p_order_id,p_store_id,v_old.status,v_order.status,p_order->>'cancel_reason');
  end if;
  select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at,i.id),'[]'::jsonb)
    into v_items from public.order_items i where order_id=p_order_id;
  return jsonb_build_object('order',to_jsonb(v_order)||jsonb_build_object('items',v_items),'stock',v_stock);
end;
$$;
revoke all on function public.save_order_atomic(text,uuid,text,jsonb,timestamptz) from public;
grant execute on function public.save_order_atomic(text,uuid,text,jsonb,timestamptz) to anon,authenticated;
