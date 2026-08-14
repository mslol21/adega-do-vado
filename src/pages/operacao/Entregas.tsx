import React from 'react';
import { useOrders } from '../../context/OrderContext';
import { OrderCard } from '../../components/operacao/OrderCard';
import { MapPin } from 'lucide-react';

export const Entregas: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  const emEntrega = orders.filter(o => o.status === 'EM_ENTREGA');

  return (
    <div className="flex flex-col h-full bg-[#080508] overflow-y-auto lg:overflow-hidden">
      <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#C9963C]/10 bg-[#100810]">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#C9963C]">Em Entrega</h1>
        <p className="text-xs sm:text-sm text-[#9B8E7D] mt-1">Pedidos que saíram com o motoboy.</p>
      </header>
      <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emEntrega.map(order => (
            <div key={order.id} className="bg-[#120B14] border border-[#C9963C]/20 rounded-2xl overflow-hidden flex flex-col shadow-xl">
              <OrderCard order={order} variant="compact" />
              
              <div className="p-4 border-t border-[#C9963C]/10 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-white/90 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                  <MapPin className="text-[#C9963C] shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold text-white">
                      {order.delivery_street || 'Endereço não informado'}, nº {order.delivery_number || 'S/N'}
                      {order.delivery_complement ? ` (${order.delivery_complement})` : ''}
                    </p>
                    <p className="text-xs text-[#9B8E7D] mt-0.5">
                      {order.delivery_neighborhood || ''} {order.delivery_city ? `- ${order.delivery_city}` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="p-3.5 bg-black/50 border border-[#C9963C]/15 rounded-xl">
                  <p className="text-[10px] text-[#9B8E7D] uppercase tracking-widest font-black mb-1">A Receber no Destino</p>
                  <p className="text-base font-black text-white">{order.payment_method?.toUpperCase() || 'PAGAMENTO'} • <span className="text-[#C9963C]">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</span></p>
                  {order.change_for && (
                    <p className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1">
                      <span>💵 Levar troco para:</span>
                      <span>{(order.change_for).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</span>
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => updateOrderStatus(order.id, 'CONCLUIDO')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm tracking-wide rounded-xl transition-all shadow-lg active:scale-95 border border-emerald-400/30 flex items-center justify-center gap-2"
                >
                  <span>Confirmar Entrega</span>
                  <span className="opacity-80">✓</span>
                </button>
              </div>
            </div>
          ))}
          {emEntrega.length === 0 && (
            <div className="col-span-full text-center py-20 text-[#9B8E7D] bg-white/[0.02] border border-[#C9963C]/10 rounded-2xl">
              Nenhuma entrega em andamento no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
