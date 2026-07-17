import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';

interface FixedFooterProps {
  onClick: () => void;
}

export const FixedFooter: React.FC<FixedFooterProps> = ({ onClick }) => {
  const { totalItems, totalPrice } = useCart();
  const { theme } = useStore();

  return (
    <>
      {totalItems > 0 && (
        <div
          className="fixed bottom-6 left-4 right-4 z-40 md:hidden animate-slide-up"
        >
          <button
            onClick={onClick}
            className="w-full p-5 rounded-[24px] flex items-center justify-between shadow-2xl active:scale-95 transition-all group"
            style={{ 
              background: theme.gradientAccent, 
              color: theme.bgPrimary,
              boxShadow: theme.shadowAccent
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
                   style={{ background: `${theme.bgPrimary}20`, color: theme.bgPrimary }}>
                <ShoppingBag size={24} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-black tracking-widest leading-none mb-1" style={{ color: `${theme.bgPrimary}50` }}>Ver Carrinho</p>
                <p className="font-black text-lg leading-none">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xl font-black tabular-nums">
                {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <div className="p-2 rounded-full group-hover:translate-x-1 transition-transform"
                   style={{ background: `${theme.bgPrimary}20` }}>
                <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </button>
        </div>
      )}
    </>
  );
};
