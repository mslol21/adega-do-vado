import React from 'react';
import { useStore } from '../context/StoreContext';

export const SocialProof: React.FC = () => {
  const { theme, name, logo } = useStore();

  return (
    <section className="px-4 pb-8 pt-4">
      <div className="max-w-7xl mx-auto">
        <div 
          className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden flex items-center justify-center p-8 sm:p-16 animate-fade-in group"
          style={{ 
            minHeight: '220px',
            border: `1px solid ${theme.accent}40`,
            boxShadow: `0 20px 40px -20px ${theme.accent}40`
          }}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 opacity-60"
            style={{ 
              backgroundImage: 'url("/tabacaria_hero.png")', 
            }}
          />
          {/* Overlay gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${theme.bgPrimary}E6, ${theme.bgPrimary}80, ${theme.bgPrimary}E6)`
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col md:flex-row items-center text-center md:text-left gap-6 md:gap-8 max-w-3xl">
            <img 
              src={logo} 
              alt={name} 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-full shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
              style={{ border: `2px solid ${theme.accent}80`, background: theme.bgPrimary, padding: '4px' }}
            />
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-3 tracking-wide" style={{ color: theme.accent }}>
                {name}
              </h2>
              <p className="text-sm sm:text-base font-medium" style={{ color: theme.textMutedLight }}>
                As melhores marcas de vapes, narguilés, sedas e acessórios importados. 
              </p>
              <div className="mt-3 flex items-center justify-center md:justify-start gap-2 text-xs sm:text-sm font-black uppercase tracking-widest" style={{ color: theme.accentLight }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
                Zappeou, Chegou!
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

