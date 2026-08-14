import React from 'react';
import { useOrders } from '../../context/OrderContext';
import { OrderCard } from '../../components/operacao/OrderCard';

export const Preparacao: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  const recebidos = orders.filter(o => o.status === 'RECEBIDO');
  const emPreparacao = orders.filter(o => o.status === 'EM_PREPARACAO');

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#080508] overflow-y-auto lg:overflow-hidden">
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-[#C9963C]/10">
        <header className="px-4 sm:px-6 py-4 border-b border-[#C9963C]/10 bg-[#100810]">
          <h2 className="text-lg sm:text-xl font-bold text-[#C9963C]">Aguardando Preparação</h2>
        </header>
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto grid gap-4 grid-cols-1 xl:grid-cols-2">
          {recebidos.map(order => (
            <OrderCard 
              key={order.id} 
              order={order}
              actionButton={
                <button 
                  onClick={() => updateOrderStatus(order.id, 'EM_PREPARACAO')}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs sm:text-sm tracking-wide rounded-xl transition-all shadow-lg active:scale-95 border border-amber-400/30 flex items-center justify-center gap-2"
                >
                  <span>Iniciar Preparação</span>
                  <span className="opacity-80">→</span>
                </button>
              }
            />
          ))}
          {recebidos.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#9B8E7D] bg-white/[0.02] border border-[#C9963C]/10 rounded-2xl">
              Nenhum pedido aguardando preparação.
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="px-4 sm:px-6 py-4 border-b border-[#C9963C]/10 bg-[#100810]">
          <h2 className="text-lg sm:text-xl font-bold text-[#C9963C]">Em Preparação</h2>
        </header>
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto grid gap-4 grid-cols-1 xl:grid-cols-2">
          {emPreparacao.map(order => (
            <OrderCard 
              key={order.id} 
              order={order}
              actionButton={
                <button 
                  onClick={() => updateOrderStatus(order.id, 'EM_SEPARACAO')}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-400 text-black font-extrabold text-xs sm:text-sm tracking-wide rounded-xl transition-all shadow-lg active:scale-95 border border-yellow-300/40 flex items-center justify-center gap-2"
                >
                  <span>Concluir Preparação</span>
                  <span>✓</span>
                </button>
              }
            />
          ))}
          {emPreparacao.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#9B8E7D] bg-white/[0.02] border border-[#C9963C]/10 rounded-2xl">
              Nenhum pedido em preparação no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
