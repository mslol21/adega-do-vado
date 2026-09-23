import { OrderContext } from './useOrders';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isOfflineMode } from '../lib/supabase';
import type { Order, OrderItem, OrderInput, OrderStatus } from '../types';
import { useData } from './useData';
import { getPendingOrderId, clearPendingOrderId } from '../utils/orderAttempt';

type SavedOrder = { order: Order; stock: { id: string; stock_quantity: number }[] };
const errorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Não foi possível confirmar a gravação. Tente novamente.';

export const OrderProvider: React.FC<{ children: React.ReactNode; storeId: string; enableSync?: boolean }> = ({ children, storeId, enableSync = false }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(enableSync);
  const [error, setError] = useState<string | null>(null);
  const { applyStockSnapshot } = useData();
  const revision = useRef(0);
  const pending = useRef(new Set<string>());

  useEffect(() => {
    if (!enableSync || isOfflineMode) return;
    let disposed = false;
    let fetching = false;
    let refreshQueued = false;
    const fetchOrders = async () => {
      if (disposed) return;
      if (fetching) { refreshQueued = true; return; }
      fetching = true;
      const version = revision.current;
      try {
        const { data, error: orderError } = await supabase.from('orders').select('*')
          .eq('store_id', storeId).order('created_at', { ascending: false }).limit(100);
        if (orderError) throw orderError;
        const rows = (data ?? []) as Order[];
        let items: OrderItem[] = [];
        if (rows.length) {
          const response = await supabase.from('order_items').select('*').in('order_id', rows.map(o => o.id));
          if (response.error) throw response.error;
          items = (response.data ?? []) as OrderItem[];
        }
        if (!disposed && version === revision.current) {
          setOrders(rows.map(o => ({ ...o, items: items.filter(i => i.order_id === o.id) })));
        }
      } catch (err) {
        if (!disposed) setError('Não foi possível atualizar a lista de pedidos: ' + errorMessage(err));
      } finally {
        fetching = false;
        if (!disposed) {
          setLoading(false);
          if (refreshQueued) { refreshQueued = false; void fetchOrders(); }
        }
      }
    };
    void fetchOrders();
    const interval = window.setInterval(() => void fetchOrders(), 4000);
    const subscription = supabase.channel('orders-' + storeId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'store_id=eq.' + storeId }, () => void fetchOrders())
      .subscribe();
    return () => {
      disposed = true;
      window.clearInterval(interval);
      void supabase.removeChannel(subscription);
    };
  }, [storeId, enableSync]);

  const mutate = useCallback(async (action: 'create' | 'update' | 'status', id: string, payload: OrderInput, expected?: string) => {
    if (isOfflineMode) throw new Error('Sem conexão configurada. O pedido não foi gravado.');
    if (pending.current.has(id)) throw new Error('Aguarde a gravação deste pedido.');
    pending.current.add(id);
    revision.current++;
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('save_order_atomic', {
        p_store_id: storeId, p_order_id: id, p_action: action, p_order: payload,
        p_expected_updated_at: expected ?? null,
      });
      if (rpcError) throw rpcError;
      const saved = data as SavedOrder | null;
      if (!saved?.order?.id || !Array.isArray(saved.order.items)) throw new Error('Resposta de gravação inválida.');
      revision.current++;
      applyStockSnapshot(saved.stock ?? []);
      setOrders(previous => [saved.order, ...previous.filter(o => o.id !== saved.order.id)]
        .sort((a,b) => b.created_at.localeCompare(a.created_at)));
      return saved.order;
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      throw new Error(message, { cause: err });
    } finally {
      pending.current.delete(id);
    }
  }, [storeId, applyStockSnapshot]);

  const createOrder = async (payload: OrderInput) => {
    const id = getPendingOrderId(storeId, payload);
    const saved = await mutate('create', id, payload);
    clearPendingOrderId(storeId, id);
    return saved;
  };
  const updateOrder = async (id: string, payload: OrderInput) => {
    const existing = orders.find(o => o.id === id);
    if (!existing) throw new Error('Pedido não encontrado. Atualize a lista.');
    await mutate('update', id, payload, existing.updated_at);
  };
  const updateOrderStatus = async (id: string, status: OrderStatus, notes?: string) => {
    const existing = orders.find(o => o.id === id);
    if (!existing) throw new Error('Pedido não encontrado. Atualize a lista.');
    await mutate('status', id, { status, cancel_reason: notes }, existing.updated_at);
  };

  return (
    <OrderContext.Provider value={{ orders, loading: loading && !isOfflineMode, error, createOrder, updateOrderStatus, updateOrder }}>
      {error && <div role="alert" className="fixed top-0 inset-x-0 z-[2000] bg-red-950 text-white p-4 shadow-lg flex justify-between gap-4">
        <span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Fechar aviso">Fechar</button>
      </div>}
      {children}
    </OrderContext.Provider>
  );
};
