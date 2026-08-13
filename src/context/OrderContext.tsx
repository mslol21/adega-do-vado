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

    // Polling de sincronização automática a cada 4 segundos para garantir sincronia em tablets e celulares
    const syncInterval = setInterval(() => {
      fetchOrders();
    }, 4000);

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
                if (prev.some(o => o.id === payload.new.id)) return prev;
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
        clearInterval(syncInterval);
        supabase.removeChannel(orderSubscription);
      };
    }

    return () => {
      clearInterval(syncInterval);
    };
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
      // 1. Busca os pedidos no Supabase sem depender de relacoes de chave estrangeira no cache do schema
      const { data: rawOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) {
        console.warn('Erro ao consultar orders no Supabase:', error);
        throw error;
      }
      
      let dbOrders = (rawOrders as Order[]) || [];

      // 2. Busca os itens de cada pedido separadamente
      if (dbOrders.length > 0) {
        const orderIds = dbOrders.map(o => o.id);
        try {
          const { data: rawItems } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);

          const itemsList = rawItems || [];
          dbOrders = dbOrders.map(o => ({
            ...o,
            items: itemsList.filter((i: any) => i.order_id === o.id)
          }));
        } catch (itemErr) {
          console.warn('Aviso ao carregar order_items:', itemErr);
        }
      }

      const combined = [...dbOrders];
      
      // Preserva vendas salvas localmente que ainda nao subiram pro banco
      localSaved.forEach(lo => {
        if (!combined.some(o => o.id === lo.id || (o.order_number === lo.order_number && o.order_number > 0))) {
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
    const newUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    const now = new Date().toISOString();
    const maxOrderNum = orders.reduce((max, o) => Math.max(max, o.order_number || 0), 0);
    const nextOrderNum = maxOrderNum + 1;
    
    const localOrder: Order = {
      id: newUuid,
      store_id: storeId,
      order_number: nextOrderNum,
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
        id: 'item_' + idx + '_' + Math.random().toString(36).substr(2, 5),
        order_id: newUuid,
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
      // Busca o ultimo numero de pedido gravado no Supabase para evitar conflito de chave unica
      let dbOrderNumber = nextOrderNum;
      try {
        const { data: maxData } = await supabase
          .from('orders')
          .select('order_number')
          .eq('store_id', storeId)
          .order('order_number', { ascending: false })
          .limit(1);

        if (maxData && maxData.length > 0 && typeof maxData[0].order_number === 'number' && maxData[0].order_number >= dbOrderNumber) {
          dbOrderNumber = maxData[0].order_number + 1;
        }
      } catch (err) {
        console.warn('Erro ao consultar ultimo order_number:', err);
      }

      const { items, ...rawOrderInfo } = orderData;
      const orderInfo: any = {
        id: newUuid,
        store_id: storeId,
        order_number: dbOrderNumber,
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
      
      let order: any = null;
      const { data: insertedData, error: orderError } = await supabase
        .from('orders')
        .insert([orderInfo])
        .select()
        .single();
        
      if (orderError) {
        console.error('Erro de Inserção de Pedido no Supabase:', orderError);
        // Tenta sem order_number fixo caso haja restricoes na tabela
        delete orderInfo.order_number;
        const { data: retryOrder, error: retryError } = await supabase
          .from('orders')
          .insert([orderInfo])
          .select()
          .single();

        if (retryError) {
          console.error('Erro no retry de insercao:', retryError);
          throw retryError;
        }
        order = retryOrder;
      } else {
        order = insertedData;
      }
      
      const createdDbOrder = order || { ...orderInfo, created_at: now, updated_at: now };

      // 2. Insert items if any
      if (items && items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: createdDbOrder.id,
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
      try {
        await supabase.from('order_status_history').insert([{
          order_id: createdDbOrder.id,
          store_id: storeId,
          to_status: createdDbOrder.status || 'NOVO'
        }]);
      } catch (hErr) {
        console.warn('Erro secundario ao registrar historico:', hErr);
      }

      const finalOrder = {
        ...createdDbOrder,
        items: items || []
      } as Order;

      // Replace temp local order with saved DB order
      setOrders(prev => {
        const updated = prev.map(o => o.id === newUuid ? finalOrder : o);
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
