import React from 'react';
import { useOrders } from '../../context/OrderContext';
import { OrderCard } from '../../components/operacao/OrderCard';

export const Prontos: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  const separados = orders.filter(o => o.status === 'SEPARADO' || o.status === 'PRONTO');

  return (
    <div className="flex flex-col h-full bg-[#080508] overflow-y-auto lg:overflow-hidden">
      <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#C9963C]/10 bg-[#100810]">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#C9963C]">Pedidos Prontos</h1>
        <p className="text-xs sm:text-sm text-[#9B8E7D] mt-1">Aguardando retirada pelo cliente ou envio para entrega.</p>
      </header>
      <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {separados.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              actionButton={
                order.order_type === 'DELIVERY' ? (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'EM_ENTREGA')}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm tracking-wide rounded-xl transition-all shadow-lg active:scale-95 border border-purple-400/30 flex items-center justify-center gap-2"
                  >
                    <span>Enviar para Entrega</span>
                    <span className="opacity-80">🚚</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'CONCLUIDO')}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm tracking-wide rounded-xl transition-all shadow-lg active:scale-95 border border-emerald-400/30 flex items-center justify-center gap-2"
                  >
                    <span>Entregar ao Cliente</span>
                    <span className="opacity-80">✓</span>
                  </button>
                )
              }
            />
          ))}
          {separados.length === 0 && (
            <div className="col-span-full text-center py-20 text-[#9B8E7D] bg-white/[0.02] border border-[#C9963C]/10 rounded-2xl">
              Nenhum pedido pronto no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
