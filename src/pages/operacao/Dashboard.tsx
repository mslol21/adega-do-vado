import React, { useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { OrderCard } from '../../components/operacao/OrderCard';
import type { OrderStatus } from '../../types';
import { DollarSign, TrendingUp, CreditCard, Award, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { orders, loading } = useOrders();
  const { activeRole, opEmployee, profile } = useAuth();
  const [showFinance, setShowFinance] = useState(true);

  const currentRole = opEmployee?.role || activeRole || profile?.role || 'ATENDENTE';

  if (currentRole !== 'ADMIN') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#080508] text-white">
        <div className="w-16 h-16 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center justify-center mb-4 text-red-400">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#C9963C] mb-2">Acesso Restrito ao Administrador</h2>
        <p className="text-sm text-[#9B8E7D] max-w-md mb-6">
          O Dashboard com controle financeiro e visão geral da operação é exclusivo para o setor de Administração.
        </p>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'CANCELADO');
  const getOrdersByStatus = (status: OrderStatus) => orders.filter(o => o.status === status);
  const getOrdersByStatuses = (statuses: OrderStatus[]) => orders.filter(o => statuses.includes(o.status));

  // Cálculos Financeiros
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const ticketMedio = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

  const pixOrders = activeOrders.filter(o => o.payment_method?.toLowerCase() === 'pix');
  const pixTotal = pixOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const cardOrders = activeOrders.filter(o => ['card', 'cartao', 'credito', 'debito'].includes(o.payment_method?.toLowerCase() || ''));
  const cardTotal = cardOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const cashOrders = activeOrders.filter(o => ['cash', 'dinheiro'].includes(o.payment_method?.toLowerCase() || ''));
  const cashTotal = cashOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Ranking de Produtos Mais Vendidos
  const productSalesMap: { [name: string]: { qty: number; total: number } } = {};
  activeOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const name = item.product_name || 'Produto';
      if (!productSalesMap[name]) {
        productSalesMap[name] = { qty: 0, total: 0 };
      }
      productSalesMap[name].qty += item.quantity || 1;
      productSalesMap[name].total += (item.total_price || item.unit_price * item.quantity || 0);
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C9963C]/20 border-t-[#C9963C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080508] overflow-y-auto lg:overflow-hidden">
      <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#C9963C]/10 bg-[#100810] flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#C9963C]">Visão Geral da Operação</h1>
          <p className="text-xs sm:text-sm text-[#9B8E7D] mt-1">Acompanhamento de pedidos e fluxo financeiro em tempo real</p>
        </div>
        <button
          onClick={() => setShowFinance(!showFinance)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#C9963C]/15 border border-[#C9963C]/30 text-[#C9963C] font-bold text-xs hover:bg-[#C9963C]/25 transition-all"
        >
          <DollarSign size={16} />
          <span>{showFinance ? 'Ocultar Financeiro' : 'Exibir Financeiro'}</span>
          {showFinance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </header>

      {/* Seção de Controle Financeiro / Resumo de Caixa */}
      {showFinance && (
        <div className="px-4 sm:px-8 pt-6 pb-2 border-b border-[#C9963C]/10 bg-black/40 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#C9963C] flex items-center gap-2">
              <DollarSign size={16} /> Resumo Financeiro & Caixa Hoje
            </h2>
            <span className="text-[10px] text-[#9B8E7D] font-mono">{activeOrders.length} pedidos faturados</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#C9963C]/20 to-[#C9963C]/5 border border-[#C9963C]/40 text-white">
              <p className="text-[10px] uppercase font-bold text-[#C9963C] tracking-wider mb-1 flex items-center gap-1.5">
                <TrendingUp size={14} /> Faturamento Total
              </p>
              <p className="text-2xl font-black text-[#C9963C]">
                {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-[10px] text-[#9B8E7D] mt-1">Ticket Médio: {ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-white">
              <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider mb-1">⚡ Total via PIX</p>
              <p className="text-2xl font-black text-blue-300">
                {pixTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-[10px] text-blue-400/80 mt-1">{pixOrders.length} vendas</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-white">
              <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider mb-1 flex items-center gap-1.5">
                <CreditCard size={14} /> Total via Cartão
              </p>
              <p className="text-2xl font-black text-purple-300">
                {cardTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-[10px] text-purple-400/80 mt-1">{cardOrders.length} vendas</p>
            </div>

            <div className="p-4 rounded-2xl bg-green-950/40 border border-green-500/30 text-white">
              <p className="text-[10px] uppercase font-bold text-green-400 tracking-wider mb-1">💵 Total em Dinheiro</p>
              <p className="text-2xl font-black text-green-300">
                {cashTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-[10px] text-green-400/80 mt-1">{cashOrders.length} vendas</p>
            </div>
          </div>

          {/* Ranking Top Vendas */}
          {topProducts.length > 0 && (
            <div className="pt-2 pb-3">
              <p className="text-[10px] uppercase font-bold text-[#9B8E7D] tracking-widest mb-2 flex items-center gap-1.5">
                <Award size={12} className="text-[#C9963C]" /> Mais Vendidos
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {topProducts.map((tp, idx) => (
                  <div key={tp.name} className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs flex items-center gap-2 flex-shrink-0">
                    <span className="w-4 h-4 rounded-full bg-[#C9963C] text-black font-extrabold text-[10px] flex items-center justify-center">{idx + 1}</span>
                    <span className="font-bold text-white max-w-[140px] truncate">{tp.name}</span>
                    <span className="text-[#C9963C] font-mono text-[11px]">({tp.qty}x)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cards de Resumo Operacional */}
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
