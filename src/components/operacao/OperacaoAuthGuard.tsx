import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Lock, UserCheck, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';

interface OperacaoAuthGuardProps {
  children: React.ReactNode;
}

export const OperacaoAuthGuard: React.FC<OperacaoAuthGuardProps> = ({ children }) => {
  const { activeRole, setActiveRole, opEmployee, loginOpEmployee } = useAuth();
  const store = useStore();
  const [selectedRole, setSelectedRole] = useState<string>(activeRole || 'ATENDENTE');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Se o funcionário já estiver autenticado na sessão do terminal, libera o acesso aos setores
  if (opEmployee?.authenticated) {
    return <>{children}</>;
  }

  const sectors = [
    { value: 'ATENDENTE', label: '🛒 Atendimento / PDV', desc: 'Lançamento de vendas de balcão', color: '#C9963C' },
    { value: 'RECEBIMENTO', label: '📥 Recebimento de Pedidos', desc: 'Aceite de novos pedidos do site/zap', color: '#3B82F6' },
    { value: 'PREPARACAO', label: '👨‍🍳 Cozinha & Preparação', desc: 'Preparo de bebidas, lanches e petiscos', color: '#F59E0B' },
    { value: 'SEPARACAO', label: '📦 Separação de Estoque', desc: 'Checklist e embalagem para entrega', color: '#8B5CF6' },
    { value: 'ENTREGA', label: '🛵 Motoboy & Entregas', desc: 'Despacho e confirmação de entregas', color: '#10B981' },
    { value: 'ADMIN', label: '👑 Admin / Visão Geral', desc: 'Acesso total a todas as áreas e métricas', color: '#EF4444' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pin) {
      setError('Por favor, informe a senha ou PIN de acesso.');
      return;
    }

    const success = loginOpEmployee(selectedRole, pin, employeeName.trim() || undefined);
    if (!success) {
      setError(selectedRole === 'ADMIN' ? 'Senha de administrador incorreta (Padrão: vado2025).' : 'PIN de acesso incorreto (PIN padrão: 1234).');
    } else {
      setActiveRole(selectedRole);
    }
  };

  const currentSectorObj = sectors.find(s => s.value === selectedRole);

  return (
    <div className="min-h-screen w-full bg-[#080508] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C9963C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 bg-[#100810] border border-[#C9963C]/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header da Loja */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-black/60 border border-[#C9963C]/40 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Lock className="text-[#C9963C]" size={28} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 bg-[#C9963C]/10 border border-[#C9963C]/30 text-[#C9963C] rounded-full inline-block mb-2">
            {store.name}
          </span>
          <h1 className="text-2xl font-serif font-bold text-white">Acesso Restrito à Operação</h1>
          <p className="text-xs text-[#9B8E7D] mt-1">Selecione seu setor e informe seu PIN de acesso para continuar.</p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Seleção do Setor */}
          <div>
            <label className="block text-xs font-bold text-[#C9963C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck size={14} /> Selecione o Setor de Atuação
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
              {sectors.map(sec => {
                const isSelected = selectedRole === sec.value;
                return (
                  <button
                    key={sec.value}
                    type="button"
                    onClick={() => {
                      setSelectedRole(sec.value);
                      setError('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#C9963C]/15 border-[#C9963C] shadow-md'
                        : 'bg-black/40 border-white/5 hover:border-white/20 opacity-80'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{sec.label}</p>
                      <p className="text-[10px] text-[#9B8E7D]">{sec.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C9963C] shadow-glow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nome do Funcionário (Opcional) */}
          <div>
            <label className="block text-xs font-bold text-[#9B8E7D] mb-1">
              Nome do Operador / Funcionário (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: João Silva"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full bg-[#080508] border border-[#C9963C]/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#C9963C]"
            />
          </div>

          {/* PIN / Senha de Acesso */}
          <div>
            <label className="block text-xs font-bold text-[#C9963C] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <KeyRound size={14} /> {selectedRole === 'ADMIN' ? 'Senha de Administrador' : 'PIN de Acesso do Funcionário'}
            </label>
            <input
              type="password"
              placeholder={selectedRole === 'ADMIN' ? 'Senha (ex: vado2025)' : 'PIN (Padrão: 1234)'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-[#080508] border border-[#C9963C]/30 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-[#C9963C] tracking-widest text-center font-bold"
              autoFocus
            />
            <p className="text-[10px] text-[#9B8E7D] text-center mt-1">
              {selectedRole === 'ADMIN' ? 'Senha padrão: vado2025' : 'PIN padrão de operador: 1234'}
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl text-center font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            className="w-full bg-[#C9963C] text-black font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#b08030] transition-all shadow-lg active:scale-98 text-sm"
          >
            <span>Acessar Setor {currentSectorObj?.label.split(' ')[1] || ''}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#C9963C]/10 text-center">
          <p className="text-[10px] text-[#9B8E7D] flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-[#C9963C]" />
            Terminal de Operação Seguro • {store.name}
          </p>
        </div>
      </div>
    </div>
  );
};
