import React, { useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import type { Order } from '../../types';
import { ShieldAlert, X, Lock, CheckCircle2 } from 'lucide-react';

interface CancelOrderModalProps {
  order: Order;
  onClose: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ order, onClose }) => {
  const { updateOrderStatus } = useOrders();
  const [adminPassword, setAdminPassword] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminPassword.trim()) {
      setError('Por favor, informe a senha de administrador.');
      return;
    }

    // Busca a senha customizada de admin para esta loja no localStorage, ou usa as senhas padrao
    const customAdminPin = localStorage.getItem(`op_pin_ADMIN_${order.store_id}`) || localStorage.getItem('op_pin_ADMIN');
    
    let isValid = false;
    if (customAdminPin) {
      isValid = adminPassword.trim() === customAdminPin.trim();
    } else {
      const input = adminPassword.trim();
      isValid = input === 'vado2025' || input === '2025' || input === 'admin';
    }

    if (!isValid) {
      setError('Senha de Administrador incorreta! Apenas administradores podem cancelar pedidos.');
      return;
    }

    try {
      setLoading(true);
      await updateOrderStatus(order.id, 'CANCELADO', reason.trim() || 'Cancelado pelo Administrador');
      onClose();
    } catch (err) {
      setError('Erro ao cancelar o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#100810] border border-red-500/30 rounded-3xl max-w-md w-full p-6 text-white relative animate-slide-up shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-red-400">Cancelar Pedido #{order.order_number}</h3>
            <p className="text-xs text-[#9B8E7D]">Requer confirmação com Senha de Admin</p>
          </div>
        </div>

        <form onSubmit={handleCancel} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#C9963C] mb-1 flex items-center gap-1.5">
              <Lock size={12} /> Senha do Administrador *
            </label>
            <input
              type="password"
              placeholder="Digite a Senha de Admin"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-[#080508] border border-[#C9963C]/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 tracking-wider font-bold"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#9B8E7D] mb-1">
              Motivo do Cancelamento (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cliente desistiu, item esgotado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#080508] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#C9963C] resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/70 border border-red-500/50 text-red-300 text-xs rounded-xl text-center font-medium animate-shake">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-xs transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Cancelando...' : 'Confirmar Cancelamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
