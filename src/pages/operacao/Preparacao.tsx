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
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto grid gap-4 grid-cols-1 sm:grid-cols-2">
          {recebidos.map(order => (
            <OrderCard 
              key={order.id} 
              order={order}
              actionButton={
                <button 
                  onClick={() => updateOrderStatus(order.id, 'EM_PREPARACAO')}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors"
                >
                  Iniciar Preparação
                </button>
              }
            />
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="px-4 sm:px-6 py-4 border-b border-[#C9963C]/10 bg-[#100810]">
          <h2 className="text-lg sm:text-xl font-bold text-[#C9963C]">Em Preparação</h2>
        </header>
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto grid gap-4 grid-cols-1 sm:grid-cols-2">
          {emPreparacao.map(order => (
            <OrderCard 
              key={order.id} 
              order={order}
              actionButton={
                <button 
                  onClick={() => updateOrderStatus(order.id, 'EM_SEPARACAO')}
                  className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
                >
                  Concluir Preparação
                </button>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
