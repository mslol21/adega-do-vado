import React, { useState } from 'react';
import { Clock, User, MessageSquare, Printer, Ban } from 'lucide-react';
import type { Order } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { printReceipt } from '../../utils/printReceipt';
import { CancelOrderModal } from './CancelOrderModal';

interface OrderCardProps {
  order: Order;
  variant?: 'compact' | 'full';
  onClick?: () => void;
  actionButton?: React.ReactNode;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, variant = 'full', onClick, actionButton }) => {
  const isCompact = variant === 'compact';
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const timeElapsed = formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR });

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    printReceipt(order);
  };
  
  return (
    <>
      <div 
        onClick={onClick}
        className={`bg-[#080508] border border-[#C9963C]/20 rounded-xl overflow-hidden hover:border-[#C9963C]/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="p-4 border-b border-[#C9963C]/10 flex justify-between items-start bg-white/5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#C9963C] text-lg">#{order.order_number}</h3>
              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                order.status === 'CANCELADO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-white/70'
              }`}>
                {order.status === 'CANCELADO' ? 'CANCELADO' : order.order_type}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#9B8E7D] text-xs mt-1">
              <User size={12} />
              <span>{order.customer_name || 'Cliente Balcão'}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold text-white tabular-nums">
              {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handlePrint}
                title="Imprimir Comprovante de Retirada (80mm)"
                className="px-2 py-1 rounded-lg bg-[#C9963C]/20 hover:bg-[#C9963C] text-[#C9963C] hover:text-black font-bold text-[10px] flex items-center gap-1 border border-[#C9963C]/30 transition-all shadow-sm active:scale-95"
              >
                <Printer size={12} />
                <span>Imprimir</span>
              </button>
              {order.status !== 'CANCELADO' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCancelModal(true);
                  }}
                  title="Cancelar Pedido (Exige Senha Admin)"
                  className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm active:scale-95"
                >
                  <Ban size={12} />
                  <span>Cancelar</span>
                </button>
              )}
              <div className="flex items-center gap-1 text-[#9B8E7D] text-[10px] ml-1">
                <Clock size={10} />
                <span>{timeElapsed}</span>
              </div>
            </div>
          </div>
        </div>
      
      {!isCompact && (
        <div className="p-4 bg-white/5 border-b border-[#C9963C]/10 space-y-2">
          {order.items?.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-white">
                <span className="text-[#C9963C] mr-2">{item.quantity}x</span>
                {item.product_name}
              </span>
            </div>
          ))}
          {order.notes && (
            <div className="mt-3 p-2 bg-[#C9963C]/10 rounded border border-[#C9963C]/20 text-xs text-[#C9963C] flex items-start gap-2">
              <MessageSquare size={14} className="shrink-0 mt-0.5" />
              <p>{order.notes}</p>
            </div>
          )}
        </div>
      )}
      
      {actionButton && (
        <div className="p-3 bg-black">
          {actionButton}
        </div>
      )}
      </div>

      {showCancelModal && (
        <CancelOrderModal 
          order={order} 
          onClose={() => setShowCancelModal(false)} 
        />
      )}
    </>
  );
};
