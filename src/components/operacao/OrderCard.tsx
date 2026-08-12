import React from 'react';
import { Clock, User, MessageSquare, Printer } from 'lucide-react';
import type { Order } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderCardProps {
  order: Order;
  variant?: 'compact' | 'full';
  onClick?: () => void;
  actionButton?: React.ReactNode;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, variant = 'full', onClick, actionButton }) => {
  const isCompact = variant === 'compact';
  
  const timeElapsed = formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR });

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="padding: 4px 0;">${item.quantity}x ${item.product_name}</td>
        <td style="padding: 4px 0; text-align: right;">R$ ${(item.total_price || item.unit_price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Pedido #${order.order_number}</title>
          <style>
            body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; color: #000; }
            h2 { text-align: center; margin: 5px 0; font-size: 16px; text-transform: uppercase; }
            p { margin: 3px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            .total { font-size: 14px; font-weight: bold; text-align: right; margin-top: 8px; }
            @media print { body { width: 100%; } }
          </style>
        </head>
        <body>
          <h2>${order.store_id === 'tabacaria' ? 'TABACARIA DO VADO' : 'ADEGA DO VADO'}</h2>
          <p style="text-align:center;">COMPROVANTE DE PEDIDO</p>
          <div class="divider"></div>
          <p><b>PEDIDO #${order.order_number}</b> (${order.order_type})</p>
          <p><b>Data:</b> ${new Date(order.created_at).toLocaleString('pt-BR')}</p>
          <p><b>Cliente:</b> ${order.customer_name || 'Balcão'}</p>
          ${order.customer_phone ? `<p><b>Tel:</b> ${order.customer_phone}</p>` : ''}
          <div class="divider"></div>
          <table>
            ${itemsHtml}
          </table>
          <div class="divider"></div>
          ${order.notes ? `<p><b>Obs:</b> ${order.notes}</p><div class="divider"></div>` : ''}
          <div class="total">TOTAL: R$ ${order.total.toFixed(2)}</div>
          <div class="divider"></div>
          <p style="text-align:center; font-size: 10px; margin-top: 15px;">Obrigado pela preferência!</p>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  return (
    <div 
      onClick={onClick}
      className={`bg-[#080508] border border-[#C9963C]/20 rounded-xl overflow-hidden hover:border-[#C9963C]/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="p-4 border-b border-[#C9963C]/10 flex justify-between items-start bg-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#C9963C] text-lg">#{order.order_number}</h3>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/70">
              {order.order_type}
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
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              title="Imprimir Cupom Não Fiscal"
              className="p-1 rounded bg-white/10 hover:bg-[#C9963C]/30 text-[#C9963C] transition-all"
            >
              <Printer size={13} />
            </button>
            <div className="flex items-center gap-1 text-[#9B8E7D] text-[10px]">
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
  );
};
