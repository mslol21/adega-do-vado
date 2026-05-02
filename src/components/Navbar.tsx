import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';

interface NavbarProps {
  onCartClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCartClick }) => {
  const { totalItems } = useCart();
  const { settings } = useData();
  const store = useStore();
  const { theme } = store;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 border-b"
      style={{
        background: `${theme.bgPrimary}E0`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: `${theme.accent}15`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          <div className="flex flex-col">
            <span
              className="font-serif font-bold text-base md:text-lg leading-none uppercase tracking-wider"
              style={{ color: theme.accent }}
            >
              {store.name}
            </span>
            <span
              className="text-[8px] uppercase tracking-[0.2em] font-medium"
              style={{ color: `${theme.accent}60` }}
            >
              {store.slogan}
            </span>
          </div>
        </div>

        <button
          onClick={onCartClick}
          className="relative p-2 rounded-full transition-colors"
          style={{ color: theme.accent }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `${theme.accent}18`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span
              className="absolute top-0 right-0 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2"
              style={{
                background: theme.gradientAccent,
                color: theme.bgPrimary,
                borderColor: theme.bgPrimary,
              }}
            >
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
