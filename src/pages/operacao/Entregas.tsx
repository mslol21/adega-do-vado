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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {emEntrega.map(order => (
            <div key={order.id} className="bg-[#100810] border border-[#C9963C]/20 rounded-xl overflow-hidden flex flex-col">
              <OrderCard order={order} variant="compact" />
              
              <div className="p-4 border-t border-[#C9963C]/10 flex-1">
                <div className="flex items-start gap-2 mb-4 text-sm text-white/80">
                  <MapPin className="text-[#C9963C] shrink-0 mt-0.5" size={16} />
                  <p>
                    {order.delivery_street}, {order.delivery_number}
                    {order.delivery_complement ? ` - ${order.delivery_complement}` : ''}
                    <br />
                    {order.delivery_neighborhood} - {order.delivery_city}
                  </p>
                </div>
                
                <div className="p-3 bg-black/50 border border-white/5 rounded-lg mb-4">
                  <p className="text-xs text-[#9B8E7D] uppercase tracking-widest font-bold mb-1">A Receber</p>
                  <p className="text-lg font-bold text-white">{order.payment_method?.toUpperCase()} • {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</p>
                  {order.change_for && (
                    <p className="text-sm text-orange-400 mt-1">Levar troco para {(order.change_for).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</p>
                  )}
                </div>
                
                <button 
                  onClick={() => updateOrderStatus(order.id, 'CONCLUIDO')}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors text-lg"
                >
                  Confirmar Entrega
                </button>
              </div>
            </div>
          ))}
          {emEntrega.length === 0 && (
            <div className="col-span-full text-center py-20 text-[#9B8E7D]">
              Nenhuma entrega em andamento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
