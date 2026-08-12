import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isOfflineMode } from '../lib/supabase';
import type { Order, OrderStatus } from '../types';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  createOrder: (order: Partial<Order>) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode; storeId: string }> = ({ children, storeId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { adjustStock } = useData();

  useEffect(() => {
    if (isOfflineMode) {
      setLoading(false);
      return;
    }

    fetchOrders();

    // Subscribe to realtime changes in orders table
    const orderSubscription = supabase
      .channel(`orders-${storeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) => prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // We only fetch active/recent orders to avoid loading history
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100); // Pagination could be added later
        
      if (error) throw error;
      setOrders(data as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Partial<Order>) => {
    // Generate temporary order object for instant UI update
    const tempId = 'ord_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    const localOrder: Order = {
      id: tempId,
      store_id: storeId,
      order_number: orders.length + 1,
      source: orderData.source || 'INTERNO',
      order_type: orderData.order_type || 'BALCAO',
      status: orderData.status || 'NOVO',
      customer_name: orderData.customer_name || 'Balcão',
      customer_phone: orderData.customer_phone || '',
      subtotal: orderData.subtotal || 0,
      delivery_fee: orderData.delivery_fee || 0,
      discount: orderData.discount || 0,
      total: orderData.total || 0,
      payment_method: orderData.payment_method || 'pix',
      notes: orderData.notes || '',
      created_at: now,
      updated_at: now,
      items: (orderData.items || []).map((item, idx) => ({
        id: 'item_' + idx,
        order_id: tempId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes
      }))
    };

    // Update local state immediately for 0ms UI response
    setOrders(prev => [localOrder, ...prev]);

    // Baixa automática de estoque
    if (orderData.items && orderData.items.length > 0) {
      adjustStock(orderData.items as any, -1);
    }

    if (isOfflineMode) {
      return localOrder;
    }

    try {
      // 1. Insert order into Supabase
      const { items, ...orderInfo } = orderData;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{ ...orderInfo, store_id: storeId, created_by: profile?.id }])
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      // 2. Insert items if any
      if (items && items.length > 0) {
        const orderItems = items.map(item => ({
          ...item,
          order_id: order.id,
        }));
        
        await supabase
          .from('order_items')
          .insert(orderItems);
      }
      
      // 3. Insert status history
      await supabase.from('order_status_history').insert([{
        order_id: order.id,
        store_id: storeId,
        to_status: order.status || 'NOVO',
        changed_by: profile?.id
      }]);

      const finalOrder = {
        ...order,
        items: items || []
      } as Order;

      // Replace temp local order with saved DB order
      setOrders(prev => prev.map(o => o.id === tempId ? finalOrder : o));
      return finalOrder;
    } catch (error) {
      console.warn('Persistência Supabase (usando estado local):', error);
      return localOrder;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, notes?: string) => {
    const targetOrder = orders.find(o => o.id === orderId);

    // Se o pedido for cancelado, devolve os itens ao estoque
    if (status === 'CANCELADO' && targetOrder && targetOrder.status !== 'CANCELADO' && targetOrder.items) {
      adjustStock(targetOrder.items as any, +1);
    }

    // 1. Atualiza o estado do React IMEDIATAMENTE (resposta instantânea no clique)
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));

    if (isOfflineMode) {
      return;
    }

    try {
      const order = orders.find(o => o.id === orderId);
      const fromStatus = order?.status;
      
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      // Update specific timestamps based on status
      if (status === 'RECEBIDO') {
        updateData.received_at = new Date().toISOString();
        updateData.received_by = profile?.id;
      } else if (status === 'EM_PREPARACAO') {
        updateData.preparing_at = new Date().toISOString();
        updateData.preparing_by = profile?.id;
      } else if (status === 'EM_SEPARACAO') {
        updateData.separating_at = new Date().toISOString();
        updateData.separating_by = profile?.id;
      } else if (status === 'PRONTO') {
        updateData.ready_at = new Date().toISOString();
      } else if (status === 'EM_ENTREGA') {
        updateData.delivery_started_at = new Date().toISOString();
        updateData.delivery_by = profile?.id;
      } else if (status === 'CONCLUIDO') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'CANCELADO') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = profile?.id;
        updateData.cancel_reason = notes;
      }
      
      // Se não for um ID temporário local, sincroniza no Supabase
      if (!orderId.startsWith('ord_')) {
        const { error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId);
          
        if (updateError) throw updateError;
        
        await supabase
          .from('order_status_history')
          .insert([{
            order_id: orderId,
            store_id: storeId,
            from_status: fromStatus,
            to_status: status,
            changed_by: profile?.id,
            notes
          }]);
      }
    } catch (error) {
      console.warn('Erro ao atualizar status no Supabase (mantendo alteração local):', error);
    }
  };

  return (
    <OrderContext.Provider value={{ orders, loading, createOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
