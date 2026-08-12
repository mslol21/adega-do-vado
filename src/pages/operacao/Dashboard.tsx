import React from 'react';
import { useOrders } from '../../context/OrderContext';
import { OrderCard } from '../../components/operacao/OrderCard';
import type { OrderStatus } from '../../types';

export const Dashboard: React.FC = () => {
  const { orders, loading } = useOrders();

  const getOrdersByStatus = (status: OrderStatus) => orders.filter(o => o.status === status);
  const getOrdersByStatuses = (statuses: OrderStatus[]) => orders.filter(o => statuses.includes(o.status));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C9963C]/20 border-t-[#C9963C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080508] overflow-y-auto lg:overflow-hidden">
      <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#C9963C]/10 bg-[#100810]">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#C9963C]">Visão Geral da Operação</h1>
        <p className="text-xs sm:text-sm text-[#9B8E7D] mt-1">Acompanhamento de pedidos em tempo real</p>
      </header>

      {/* Cards de Resumo */}
      <div className="p-4 sm:p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 shrink-0">
        {[
          { label: 'Novos', count: getOrdersByStatus('NOVO').length, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
          { label: 'Preparação', count: getOrdersByStatuses(['RECEBIDO', 'EM_PREPARACAO']).length, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
          { label: 'Separação', count: getOrdersByStatus('EM_SEPARACAO').length, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
          { label: 'Prontos', count: getOrdersByStatuses(['SEPARADO', 'PRONTO']).length, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
          { label: 'Entrega', count: getOrdersByStatus('EM_ENTREGA').length, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' }
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 border ${stat.border} ${stat.bg}`}>
            <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#9B8E7D] mb-1 sm:mb-2">{stat.label}</p>
            <p className={`text-2xl sm:text-4xl font-black ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex overflow-x-auto px-4 sm:px-8 pb-4 sm:pb-8 gap-4 sm:gap-6 min-h-[400px]">
        <KanbanColumn title="Novos" orders={getOrdersByStatus('NOVO')} />
        <KanbanColumn title="Preparação" orders={getOrdersByStatuses(['RECEBIDO', 'EM_PREPARACAO'])} />
        <KanbanColumn title="Separação" orders={getOrdersByStatus('EM_SEPARACAO')} />
        <KanbanColumn title="Prontos" orders={getOrdersByStatuses(['SEPARADO', 'PRONTO'])} />
      </div>
    </div>
  );
};

const KanbanColumn = ({ title, orders }: { title: string, orders: any[] }) => (
  <div className="w-72 sm:w-80 flex flex-col shrink-0 bg-[#100810] rounded-2xl border border-[#C9963C]/10 overflow-hidden">
    <div className="px-5 py-4 border-b border-[#C9963C]/10 bg-black/20 flex justify-between items-center">
      <h3 className="font-bold text-[#C9963C]">{title}</h3>
      <span className="text-xs bg-[#C9963C]/10 text-[#C9963C] px-2 py-1 rounded font-bold">{orders.length}</span>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} variant="compact" />
      ))}
      {orders.length === 0 && (
        <div className="text-center py-8 text-[#9B8E7D]/50 text-sm italic">
          Nenhum pedido nesta etapa
        </div>
      )}
    </div>
  </div>
);
