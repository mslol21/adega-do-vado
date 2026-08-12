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

  const saveToLocalStorage = (ordersList: Order[]) => {
    try {
      localStorage.setItem(`vado_orders_${storeId}`, JSON.stringify(ordersList));
    } catch (e) {
      console.error('Erro ao gravar pedidos no localStorage:', e);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (!isOfflineMode) {
      // Subscribe to realtime changes in orders table
      const orderSubscription = supabase
        .channel(`orders-${storeId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setOrders((prev) => {
                const updated = [payload.new as Order, ...prev];
                saveToLocalStorage(updated);
                return updated;
              });
            } else if (payload.eventType === 'UPDATE') {
              setOrders((prev) => {
                const updated = prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } : o);
                saveToLocalStorage(updated);
                return updated;
              });
            } else if (payload.eventType === 'DELETE') {
              setOrders((prev) => {
                const updated = prev.filter((o) => o.id !== payload.old.id);
                saveToLocalStorage(updated);
                return updated;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(orderSubscription);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const fetchOrders = async () => {
    let localSaved: Order[] = [];
    try {
      const cached = localStorage.getItem(`vado_orders_${storeId}`);
      if (cached) {
        localSaved = JSON.parse(cached);
      }
    } catch (e) {
      console.error('Erro ao ler cache local de pedidos:', e);
    }

    if (isOfflineMode) {
      setOrders(localSaved);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      const dbOrders = (data as Order[]) || [];
      const combined = [...dbOrders];
      
      // Preserva vendas salvas localmente que ainda nao subiram pro banco
      localSaved.forEach(lo => {
        if (!combined.some(o => o.id === lo.id || o.order_number === lo.order_number)) {
          combined.push(lo);
        }
      });

      combined.sort((a, b) => new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime());

      setOrders(combined);
      saveToLocalStorage(combined);
    } catch (error) {
      console.warn('Erro ao carregar do Supabase (usando backup local):', error);
      setOrders(localSaved);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Partial<Order>) => {
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

    // Update local state and localStorage immediately for 0ms UI response & total persistence
    setOrders(prev => {
      const updated = [localOrder, ...prev];
      saveToLocalStorage(updated);
      return updated;
    });

    // Baixa automática de estoque
    if (orderData.items && orderData.items.length > 0) {
      adjustStock(orderData.items as any, -1);
    }

    if (isOfflineMode) {
      return localOrder;
    }

    try {
      const { items, ...rawOrderInfo } = orderData;
      const orderInfo: any = {
        store_id: storeId,
        order_number: localOrder.order_number,
        source: rawOrderInfo.source || 'INTERNO',
        order_type: rawOrderInfo.order_type || 'BALCAO',
        status: rawOrderInfo.status || 'NOVO',
        customer_name: rawOrderInfo.customer_name || 'Balcão',
        customer_phone: rawOrderInfo.customer_phone || null,
        subtotal: rawOrderInfo.subtotal || 0,
        delivery_fee: rawOrderInfo.delivery_fee || 0,
        discount: rawOrderInfo.discount || 0,
        total: rawOrderInfo.total || 0,
        payment_method: rawOrderInfo.payment_method || 'pix',
        notes: rawOrderInfo.notes || null,
      };

      if (profile?.id && typeof profile.id === 'string' && profile.id.length > 10) {
        orderInfo.created_by = profile.id;
      }
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderInfo])
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      // 2. Insert items if any
      if (items && items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes || null
        }));
        
        await supabase
          .from('order_items')
          .insert(orderItems);
      }
      
      // 3. Insert status history
      await supabase.from('order_status_history').insert([{
        order_id: order.id,
        store_id: storeId,
        to_status: order.status || 'NOVO'
      }]);

      const finalOrder = {
        ...order,
        items: items || []
      } as Order;

      // Replace temp local order with saved DB order
      setOrders(prev => {
        const updated = prev.map(o => o.id === tempId ? finalOrder : o);
        saveToLocalStorage(updated);
        return updated;
      });
      return finalOrder;
    } catch (error) {
      console.warn('Persistência Supabase (venda salva em cache local):', error);
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
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            updated_at: new Date().toISOString()
          };
        }
        return o;
      });
      saveToLocalStorage(updated);
      return updated;
    });

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
