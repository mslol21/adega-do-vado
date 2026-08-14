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

  const getOrderTypeBadge = (type: string, status: string) => {
    if (status === 'CANCELADO') {
      return (
        <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
          CANCELADO
        </span>
      );
    }
    switch (type?.toUpperCase()) {
      case 'DELIVERY':
        return (
          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            🚚 DELIVERY
          </span>
        );
      case 'RETIRADA':
        return (
          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            🛍️ RETIRADA
          </span>
        );
      case 'BALCAO':
      default:
        return (
          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-[#C9963C]/20 text-[#C9963C] border border-[#C9963C]/30">
            🏬 BALCÃO
          </span>
        );
    }
  };

  const getPaymentBadge = (pm?: string) => {
    if (!pm) return null;
    const lower = pm.toLowerCase();
    if (lower === 'pix') {
      return <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PIX</span>;
    }
    if (['card', 'cartao', 'credito', 'debito'].includes(lower)) {
      return <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">CARTÃO</span>;
    }
    if (['cash', 'dinheiro'].includes(lower)) {
      return <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">DINHEIRO</span>;
    }
    return <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/20">{pm}</span>;
  };

  return (
    <>
      <div 
        onClick={onClick}
        className={`bg-[#120B14] border border-[#C9963C]/20 rounded-2xl overflow-hidden hover:border-[#C9963C]/50 transition-all duration-300 shadow-xl flex flex-col justify-between h-full ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
      >
        <div>
          {/* Top Header */}
          <div className="p-4 border-b border-[#C9963C]/15 bg-gradient-to-r from-white/[0.04] to-transparent space-y-2.5">
            {/* Row 1: Order Number, Type Badge & Total Price */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-mono font-black text-[#C9963C] text-xl tracking-tight">#{order.order_number}</h3>
                {getOrderTypeBadge(order.order_type, order.status)}
                {getPaymentBadge(order.payment_method)}
              </div>
              <div className="text-right shrink-0">
                <span className="font-black text-lg text-white tabular-nums block">
                  {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Row 2: Customer Name & Time Elapsed */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-white/90 font-medium truncate max-w-[65%]">
                <User size={13} className="text-[#C9963C] shrink-0" />
                <span className="truncate">{order.customer_name || 'Cliente Balcão'}</span>
              </div>
              <div className="flex items-center gap-1 text-[#9B8E7D] text-[11px] shrink-0">
                <Clock size={11} className="text-[#C9963C]/70" />
                <span>{timeElapsed}</span>
              </div>
            </div>

            {/* Row 3: Action Buttons (Imprimir / Cancelar) */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  title="Imprimir Comprovante de Retirada (80mm)"
                  className="px-2.5 py-1 rounded-lg bg-[#C9963C]/15 hover:bg-[#C9963C] text-[#C9963C] hover:text-black font-bold text-[11px] flex items-center gap-1.5 border border-[#C9963C]/30 transition-all shadow-sm active:scale-95"
                >
                  <Printer size={13} />
                  <span>Imprimir</span>
                </button>
                {order.status !== 'CANCELADO' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCancelModal(true);
                    }}
                    title="Cancelar Pedido (Exige Senha Admin)"
                    className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/80 border border-red-500/30 text-red-400 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Ban size={13} />
                    <span>Cancelar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Body Section (Items List) */}
          {!isCompact && (
            <div className="p-4 bg-black/30 space-y-2 max-h-60 overflow-y-auto">
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs sm:text-sm py-1 border-b border-white/5 last:border-0">
                  <div className="flex items-start gap-2 flex-1 pr-2">
                    <span className="font-extrabold text-[#C9963C] shrink-0">{item.quantity}x</span>
                    <span className="text-white font-medium leading-tight">{item.product_name}</span>
                  </div>
                  {item.total_price ? (
                    <span className="text-white/60 text-xs tabular-nums font-mono">
                      {item.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  ) : null}
                </div>
              ))}

              {order.notes && (
                <div className="mt-3 p-2.5 bg-[#C9963C]/10 rounded-xl border border-[#C9963C]/20 text-xs text-[#C9963C] flex items-start gap-2">
                  <MessageSquare size={14} className="shrink-0 mt-0.5" />
                  <p className="leading-snug">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Button */}
        {actionButton && (
          <div className="p-3 bg-black/60 border-t border-[#C9963C]/10">
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
