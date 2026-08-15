import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Inbox, 
  ChefHat, 
  PackageSearch, 
  CheckCircle, 
  Bike 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';

export const Sidebar: React.FC = () => {
  const { profile, activeRole, setActiveRole, opEmployee, logoutOpEmployee } = useAuth();
  const { orders } = useOrders();

  const newOrdersCount = orders.filter(o => o.status === 'NOVO').length;
  const receivingCount = orders.filter(o => o.status === 'RECEBIDO').length;
  const preparingCount = orders.filter(o => o.status === 'EM_PREPARACAO').length;
  const separatingCount = orders.filter(o => o.status === 'EM_SEPARACAO').length;
  const readyCount = orders.filter(o => o.status === 'PRONTO' || o.status === 'SEPARADO').length;
  const deliveryCount = orders.filter(o => o.status === 'EM_ENTREGA').length;

  const allNavLinks = [
    { to: '', end: true, label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['ADMIN'] },
    { to: 'atendimento', label: 'Frente de Caixa', icon: <ShoppingCart size={18} />, roles: ['ADMIN', 'GERENTE', 'ATENDENTE'] },
    { to: 'recebimento', label: 'Receber', icon: <Inbox size={18} />, count: newOrdersCount, roles: ['ADMIN', 'GERENTE', 'RECEBIMENTO'] },
    { to: 'preparacao', label: 'Preparo', icon: <ChefHat size={18} />, count: receivingCount + preparingCount, roles: ['ADMIN', 'GERENTE', 'PREPARACAO'] },
    { to: 'separacao', label: 'Separação', icon: <PackageSearch size={18} />, count: separatingCount, roles: ['ADMIN', 'GERENTE', 'SEPARACAO'] },
    { to: 'prontos', label: 'Prontos', icon: <CheckCircle size={18} />, count: readyCount, roles: ['ADMIN', 'GERENTE', 'ENTREGA'] },
    { to: 'entregas', label: 'Entregas', icon: <Bike size={18} />, count: deliveryCount, roles: ['ADMIN', 'GERENTE', 'ENTREGA'] },
  ];

  const currentRole = activeRole || profile?.role || 'ADMIN';

  // Filter links based on selected sector role
  const navLinks = allNavLinks.filter(item => {
    if (currentRole === 'ADMIN' || currentRole === 'GERENTE') return true;
    return item.roles.includes(currentRole);
  });

  const rolesOptions = [
    { value: 'ADMIN', label: '👑 Admin / Visão Geral' },
    { value: 'ATENDENTE', label: '🛒 Atendimento (PDV)' },
    { value: 'RECEBIMENTO', label: '📥 Recebimento de Pedidos' },
    { value: 'PREPARACAO', label: '👨‍🍳 Cozinha / Preparação' },
    { value: 'SEPARACAO', label: '📦 Separação de Estoque' },
    { value: 'ENTREGA', label: '🛵 Motoboy / Entregas' },
  ];

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="w-64 min-h-screen bg-[#100810] border-r border-[#C9963C]/10 hidden lg:flex flex-col text-white shrink-0">
        <div className="p-6 border-b border-[#C9963C]/10">
          <h2 className="font-serif font-bold text-xl text-[#C9963C] uppercase tracking-wider">Operação</h2>
          <p className="text-xs text-[#9B8E7D] uppercase tracking-widest mt-1">Setores & Fluxo</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navLinks.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-[#C9963C]/15 text-[#C9963C]' : 'text-[#9B8E7D] hover:bg-[#C9963C]/5 hover:text-white'}`}
                >
                  {item.icon}
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-[#C9963C] text-[#080508] text-[10px] font-bold px-2 py-0.5 rounded-full">{item.count}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Seletor de Setor no Rodapé do Sidebar */}
        <div className="p-4 border-t border-[#C9963C]/10 text-xs text-[#9B8E7D] space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#C9963C]/70 block mb-1">
              Setor do Funcionário
            </label>
            <select
              value={currentRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="w-full bg-[#080508] border border-[#C9963C]/30 text-white rounded-xl p-2.5 outline-none font-bold text-xs cursor-pointer focus:border-[#C9963C]"
            >
              {rolesOptions.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-[#080508] p-3 rounded-xl border border-[#C9963C]/10 flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-xs">{opEmployee?.name || profile?.name || 'Operador'}</p>
              <p className="text-[9px] uppercase tracking-widest text-[#C9963C]">{currentRole}</p>
            </div>
            <button
              onClick={() => logoutOpEmployee()}
              className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-lg text-[10px] font-bold transition-all"
              title="Bloquear Terminal / Sair"
            >
              🔒 Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Header Bar */}
      <header className="lg:hidden bg-[#100810] border-b border-[#C9963C]/20 sticky top-0 z-40 w-full shrink-0">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#C9963C]/10">
          <div>
            <h2 className="font-serif font-bold text-base text-[#C9963C]">Painel de Operação</h2>
            <p className="text-[10px] text-[#9B8E7D] uppercase tracking-widest">{opEmployee?.name || 'Operação'} ({currentRole})</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currentRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="bg-[#080508] border border-[#C9963C]/30 text-[#C9963C] rounded-lg p-1.5 outline-none text-[11px] font-bold"
            >
              {rolesOptions.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              onClick={() => logoutOpEmployee()}
              className="p-1.5 bg-red-950/60 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold"
              title="Bloquear Terminal / Sair"
            >
              🔒
            </button>
          </div>
        </div>
        
        {/* Scrollable Horizontal Tabs Bar */}
        <nav className="flex overflow-x-auto py-2 px-3 gap-2 scrollbar-none">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                isActive ? 'bg-[#C9963C] text-black shadow-md' : 'bg-white/5 text-[#9B8E7D] border border-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="bg-black text-[#C9963C] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Mobile / Tablet Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#100810]/95 backdrop-blur-md border-t border-[#C9963C]/30 px-1 py-2 flex justify-around items-center shadow-2xl">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `flex flex-col items-center justify-center p-1.5 rounded-lg text-[9px] font-bold transition-all relative ${isActive ? 'text-[#C9963C] scale-105' : 'text-[#9B8E7D]'}`}
          >
            <div className="relative">
              {item.icon}
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#C9963C] text-[#080508] text-[9px] font-extrabold px-1 rounded-full min-w-[14px] text-center">
                  {item.count}
                </span>
              )}
            </div>
            <span className="mt-1 tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};
