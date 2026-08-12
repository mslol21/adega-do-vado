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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {separados.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              actionButton={
                order.order_type === 'DELIVERY' ? (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'EM_ENTREGA')}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Enviar para Entrega
                  </button>
                ) : (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'CONCLUIDO')}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Entregar ao Cliente
                  </button>
                )
              }
            />
          ))}
          {separados.length === 0 && (
            <div className="col-span-full text-center py-20 text-[#9B8E7D]">
              Nenhum pedido pronto.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
