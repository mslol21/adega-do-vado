import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Flame, GlassWater, ArrowRight } from 'lucide-react';
import { supabase, useNeon } from '../lib/supabase';

const STORES = [
  { id: 'tabacaria', label: 'Tabacaria do Vado', icon: <Flame size={24} />, color: '#F2BC1B', path: '/admin/tabacaria' },
  { id: 'adega', label: 'Adega do Vado', icon: <GlassWater size={24} />, color: '#F2BC1B', path: '/admin/adega' },
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'vado2025';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('admin@adegadovado.com.br');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || submitting) return;
    setError('');
    if (!useNeon) {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_auth', 'true');
        navigate(STORES.find(s => s.id === selectedStore)?.path || '/admin/tabacaria');
      } else setError('Senha incorreta.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      const userId = data.user?.id || data.session?.user?.id;
      if (!userId) throw new Error('Sessão não confirmada.');
      const { data: profile, error: profileError } = await supabase.from('profiles')
        .select('role').eq('user_id', userId).eq('store_id', selectedStore).maybeSingle();
      if (profileError) throw profileError;
      if (profile?.role !== 'ADMIN') {
        await supabase.auth.signOut();
        throw new Error('Esta conta não tem autorização administrativa para essa loja.');
      }
      sessionStorage.setItem('admin_auth', 'true');
      navigate(STORES.find(s => s.id === selectedStore)?.path || '/admin/adega');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível autenticar. Verifique suas credenciais.');
    } finally {
      setSubmitting(false);
    }
  };

  const recoverAccess = async () => {
    if (!email.trim()) { setError('Informe seu e-mail para recuperar o acesso.'); return; }
    setSubmitting(true);
    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/admin',
      });
      if (recoveryError) throw recoveryError;
      setError('Se o e-mail estiver habilitado, as instruções de recuperação serão enviadas.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao solicitar recuperação.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D151D' }}>
      <div className="w-full max-w-md space-y-6 animate-slide-up">

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
          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
            {useNeon && <input type="email" autoComplete="username" required placeholder="E-mail do administrador" value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              className="w-full rounded-xl p-4 text-center outline-none text-sm font-medium"
              style={{ background: '#1D2B3A', border: '1px solid #F2BC1B30', color: '#FFFFFF' }} />}
            <input type="password" autoComplete={useNeon ? 'current-password' : 'off'} placeholder="Senha de acesso" value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }} autoFocus
              className="w-full rounded-xl p-4 text-center outline-none text-sm font-medium"
              style={{ background: '#1D2B3A', border: '1px solid #F2BC1B30', color: '#FFFFFF' }} />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit"
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #F2BC1B, #FFD700)', color: '#0D151D' }}>
              {submitting ? "Verificando..." : "Entrar no Painel"} <ArrowRight size={18} />
            </button>
            {useNeon && <button type="button" disabled={submitting} onClick={() => void recoverAccess()} className="text-xs text-[#F2BC1B] w-full text-center underline">Primeiro acesso ou esqueci minha senha</button>}
          </form>
        )}
      </div>
    </div>
  );
};
