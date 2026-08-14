import React from 'react';
import { useOrders } from '../../context/OrderContext';
import { OrderCard } from '../../components/operacao/OrderCard';

export const Recebimento: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  const novos = orders.filter(o => o.status === 'NOVO');

  return (
    <div className="flex flex-col h-full bg-[#080508] overflow-y-auto lg:overflow-hidden">
      <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#C9963C]/10 bg-[#100810]">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#C9963C]">Recebimento de Pedidos</h1>
        <p className="text-xs sm:text-sm text-[#9B8E7D] mt-1">Aceite os pedidos para enviá-los à preparação.</p>
      </header>
      <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {novos.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              variant="full"
              actionButton={
                <button 
                  onClick={() => updateOrderStatus(order.id, 'RECEBIDO')}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide rounded-xl transition-all shadow-lg active:scale-95 border border-blue-400/30 flex items-center justify-center gap-2"
                >
                  <span>Receber Pedido</span>
                  <span className="text-xs font-normal opacity-80">→</span>
                </button>
              }
            />
          ))}
          {novos.length === 0 && (
            <div className="col-span-full text-center py-20 text-[#9B8E7D] bg-white/[0.02] border border-[#C9963C]/10 rounded-2xl">
              Nenhum pedido novo no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
