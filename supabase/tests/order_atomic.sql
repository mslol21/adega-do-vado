-- Run in a transaction after installing 003; all fixtures are rolled back.
begin;
set local role anon;
do $$
declare
  p uuid := gen_random_uuid();
  o uuid := gen_random_uuid();
  bad uuid := gen_random_uuid();
  result jsonb;
  current_order jsonb;
  body jsonb;
  remaining integer;
  failed boolean := false;
begin
  insert into public.products(id,store_id,name,price,stock_quantity)
    values(p,'adega','__transaction_test__',5,10);
  body := jsonb_build_object('source','ONLINE','order_type','DELIVERY',
    'customer_name','Teste transacional','delivery_street','Rua de teste','delivery_number','10',
    'delivery_cep','01001000','delivery_complement','Casa','delivery_neighborhood','Centro',
    'delivery_city','São Paulo','delivery_state','SP','payment_method','cash','change_for',20,
    'discount',1,'items',jsonb_build_array(
      jsonb_build_object('product_id',p,'product_name','Sabor A','quantity',2,'unit_price',5),
      jsonb_build_object('product_id',p,'product_name','Sabor B','quantity',1,'unit_price',5)));
  result := public.save_order_atomic('adega',o,'create',body);
  current_order := result->'order';
  select stock_quantity into remaining from products where id=p;
  assert remaining=7, 'Multiple flavors must share stock';
  assert current_order->>'delivery_number'='10' and current_order->>'delivery_complement'='Casa', 'Address lost';
  assert (current_order->>'change_for')::numeric=20 and (current_order->>'total')::numeric=14, 'Totals/troco lost';
  assert jsonb_array_length(current_order->'items')=2, 'Items missing';
  perform public.save_order_atomic('adega',o,'create',body);
  select stock_quantity into remaining from products where id=p;
  assert remaining=7, 'Retry debited twice';
  body := jsonb_build_object('items',jsonb_build_array(jsonb_build_object('product_id',p,
    'product_name','Editado','quantity',4,'unit_price',5)));
  result := public.save_order_atomic('adega',o,'update',body,(current_order->>'updated_at')::timestamptz);
  select stock_quantity into remaining from products where id=p;
  assert remaining=6 and (result->'order'->>'total')::numeric=19, 'Edit stock delta wrong';
  begin
    perform public.save_order_atomic('adega',o,'update',body,(current_order->>'updated_at')::timestamptz);
  exception when others then failed := true;
  end;
  assert failed, 'Stale edit accepted';
  current_order := result->'order';
  result := public.save_order_atomic('adega',o,'status','{"status":"CANCELADO","cancel_reason":"Teste"}',
    (current_order->>'updated_at')::timestamptz);
  current_order := result->'order';
  perform public.save_order_atomic('adega',o,'status','{"status":"CANCELADO"}',
    (current_order->>'updated_at')::timestamptz);
  select stock_quantity into remaining from products where id=p;
  assert remaining=10, 'Cancellation returned stock twice';
  failed := false;
  begin
    perform public.save_order_atomic('adega',bad,'create',jsonb_build_object('items',
      jsonb_build_array(jsonb_build_object('product_id',p,'product_name','Sem estoque','quantity',11,'unit_price',5))));
  exception when others then failed := true;
  end;
  assert failed, 'Overselling accepted';
  assert not exists(select 1 from orders where id=bad), 'Failed order persisted';
  assert not exists(select 1 from order_items where order_id=bad), 'Failed items persisted';
  select stock_quantity into remaining from products where id=p;
  assert remaining=10, 'Failed order changed stock';
  -- Late item insert failure must roll back the earlier order and stock writes.
  failed := false;
  begin
    perform public.save_order_atomic('adega',bad,'create',jsonb_build_object('items',
      jsonb_build_array(jsonb_build_object('product_id',p,'product_name','Valor acima da coluna','quantity',1,'unit_price',100000000))));
  exception when others then failed := true;
  end;
  assert failed, 'Numeric overflow should fail';
  assert not exists(select 1 from orders where id=bad), 'Late failure persisted order';
  select stock_quantity into remaining from products where id=p;
  assert remaining=10, 'Late failure did not roll back stock';
end $$;
rollback;
