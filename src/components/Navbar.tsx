import React, { useState } from 'react';
import { ShoppingCart, Search, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';

interface NavbarProps {
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCartClick, searchQuery, onSearchChange }) => {
  const { totalItems } = useCart();
  const store = useStore();
  const { theme } = store;
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo & Name - Hidden when search is expanded on mobile */}
        <div className={`flex items-center gap-4 transition-all duration-300 ${isSearchExpanded ? 'hidden md:flex' : 'flex'}`}>
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

        {/* Search Bar */}
        <div className={`flex-grow max-w-md transition-all duration-300 flex items-center ${isSearchExpanded ? 'w-full' : 'w-10 md:w-full'}`}>
          <div className="relative w-full flex items-center">
            <div 
              className={`absolute left-3 transition-colors ${searchQuery ? 'text-accent' : 'text-white/30'}`}
              style={{ color: searchQuery ? theme.accent : undefined }}
            >
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchExpanded(true)}
              onBlur={() => !searchQuery && setIsSearchExpanded(false)}
              className={`w-full bg-white/5 border rounded-2xl py-2 pl-10 pr-10 text-sm outline-none transition-all focus:bg-white/10 ${isSearchExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'}`}
              style={{ 
                borderColor: isSearchExpanded ? `${theme.accent}40` : 'transparent',
                color: '#fff'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-white/30 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
            
            {/* Mobile Search Toggle */}
            {!isSearchExpanded && (
              <button 
                onClick={() => setIsSearchExpanded(true)}
                className="md:hidden p-2 text-white/60"
              >
                <Search size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Actions - Hidden when search is expanded on mobile */}
        <div className={`flex items-center gap-2 transition-all duration-300 ${isSearchExpanded ? 'hidden md:flex' : 'flex'}`}>
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
      </div>
    </nav>
  );
};
