import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Flame, GlassWater, ArrowRight } from 'lucide-react';

const STORES = [
  { id: 'tabacaria', label: 'Tabacaria do Vado', icon: <Flame size={24} />, color: '#F2BC1B', path: '/admin/tabacaria' },
  { id: 'adega', label: 'Adega do Vado', icon: <GlassWater size={24} />, color: '#F2BC1B', path: '/admin/adega' },
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'vado2025';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      const store = STORES.find(s => s.id === selectedStore);
      navigate(store?.path || '/admin/tabacaria');
    } else {
      setError('Senha incorreta.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D151D' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6">

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border"
            style={{ borderColor: '#F2BC1B40', background: '#F2BC1B10', color: '#F2BC1B' }}>
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: '#F2BC1B' }}>Painel Administrativo</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Selecione a loja e entre com sua senha</p>
        </div>

        {/* Store selector */}
        <div className="grid grid-cols-2 gap-3">
          {STORES.map(s => (
            <button key={s.id} onClick={() => setSelectedStore(s.id)}
              className="p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
              style={{
                background: selectedStore === s.id ? `${s.color}20` : '#1D2B3A',
                borderColor: selectedStore === s.id ? s.color : `${s.color}30`,
                color: s.color,
              }}>
              {s.icon}
              <span className="text-xs font-bold">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Password form */}
        {selectedStore && (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Senha de acesso" value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }} autoFocus
              className="w-full rounded-xl p-4 text-center outline-none text-sm font-medium"
              style={{ background: '#1D2B3A', border: '1px solid #F2BC1B30', color: '#FFFFFF' }} />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit"
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #F2BC1B, #FFD700)', color: '#0D151D' }}>
              Entrar no Painel <ArrowRight size={18} />
            </button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};
