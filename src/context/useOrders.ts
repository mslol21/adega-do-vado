import { createContext, useContext } from 'react';
import type { Order, OrderInput, OrderStatus } from '../types';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (order: OrderInput) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  updateOrder: (orderId: string, orderData: OrderInput) => Promise<void>;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};


