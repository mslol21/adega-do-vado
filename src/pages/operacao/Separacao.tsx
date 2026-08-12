import React, { useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import { OrderCard } from '../../components/operacao/OrderCard';
import type { Order } from '../../types';

export const Separacao: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  const emSeparacao = orders.filter(o => o.status === 'EM_SEPARACAO');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const isAllChecked = selectedOrder?.items?.every(item => checkedItems[item.id]) ?? false;

  const handleFinishSeparation = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, selectedOrder.order_type === 'DELIVERY' ? 'SEPARADO' : 'PRONTO');
      setSelectedOrder(null);
      setCheckedItems({});
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#080508] overflow-y-auto lg:overflow-hidden">
      {/* Lista de Pedidos (Esquerda) */}
      <div className={`w-full lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r border-[#C9963C]/10 bg-[#100810] shrink-0 ${selectedOrder ? 'hidden lg:flex' : 'flex'}`}>
        <header className="px-6 py-4 border-b border-[#C9963C]/10">
          <h2 className="text-xl font-bold text-[#C9963C]">Para Separar</h2>
        </header>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {emSeparacao.map(order => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className={`transition-transform active:scale-95 ${selectedOrder?.id === order.id ? 'ring-2 ring-[#C9963C]' : ''}`}
            >
              <OrderCard order={order} variant="compact" />
            </div>
          ))}
          {emSeparacao.length === 0 && (
            <div className="text-center py-10 text-[#9B8E7D]">Nenhum pedido em separação.</div>
          )}
        </div>
      </div>
      
      {/* Área de Checklist (Direita) */}
      <div className={`w-full lg:w-2/3 flex flex-col relative flex-1 ${selectedOrder ? 'flex' : 'hidden lg:flex'}`}>
        {selectedOrder ? (
          <>
            <header className="px-6 sm:px-8 py-4 sm:py-6 border-b border-[#C9963C]/10 bg-[#100810] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="lg:hidden p-2 rounded-lg bg-white/10 text-white text-xs font-bold"
                >
                  ← Voltar
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#C9963C]">Pedido #{selectedOrder.order_number}</h2>
                  <p className="text-white text-xs sm:text-sm mt-0.5">{selectedOrder.customer_name || 'Balcão'}</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-white/10 text-white/70">
                {selectedOrder.order_type}
              </span>
            </header>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-4 max-w-2xl mx-auto">
                {selectedOrder.items?.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                      checkedItems[item.id] 
                        ? 'bg-green-500/20 border-green-500/50' 
                        : 'bg-[#100810] border-[#C9963C]/20 hover:border-[#C9963C]/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      checkedItems[item.id] ? 'border-green-400 bg-green-400 text-black' : 'border-[#C9963C]/50'
                    }`}>
                      {checkedItems[item.id] && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{item.quantity}x {item.product_name}</h4>
                      {item.notes && <p className="text-sm text-[#C9963C] mt-1">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedOrder.notes && (
                <div className="mt-8 max-w-2xl mx-auto p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">Observação do Pedido</h4>
                  <p className="text-white">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#C9963C]/10 bg-[#100810]">
              <button
                onClick={handleFinishSeparation}
                disabled={!isAllChecked}
                className="w-full max-w-2xl mx-auto block py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-700 text-white font-bold text-xl rounded-xl transition-colors"
              >
                {isAllChecked ? 'Finalizar Separação' : 'Marque todos os itens para finalizar'}
              </button>
              
              <button className="w-full max-w-2xl mx-auto block py-3 mt-3 text-red-400 text-sm font-bold border border-red-400/20 rounded-xl hover:bg-red-400/10">
                Produto em Falta
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#9B8E7D] flex-col gap-4">
            <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>Selecione um pedido para separar</p>
          </div>
        )}
      </div>
    </div>
  );
};
