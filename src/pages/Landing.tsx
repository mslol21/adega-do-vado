import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, GlassWater } from 'lucide-react';

const stores = [
  {
    id: 'tabacaria',
    path: '/tabacaria',
    icon: <Flame size={40} />,
    label: 'Tabacaria',
    name: 'Henri Imports Tabaca',
    slogan: 'Vapes, Narguilés & Acessórios Premium',
    description:
      'Tudo para sua sessão com o melhor preço de Sorocaba. Essências, carvão e acessórios completos.',
    tags: ['Narguilé', 'Essências', 'Sedas', 'Isqueiros', 'Kits'],
    bgGlow: 'rgba(242,188,27,0.15)',
    bgGlow2: 'rgba(29,43,58,0.06)',
    accentColor: '#F2BC1B',
    accentLight: '#FFD700',
    borderColor: 'rgba(242,188,27,0.3)',
    gradientFrom: '#0D151D',
    gradientVia: '#1D2B3A',
    ctaGradient: 'linear-gradient(135deg, #F2BC1B 0%, #FFD700 100%)',
    shadowColor: 'rgba(242,188,27,0.3)',
    heroGradient: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.95) 100%)',
    bgImage: '/tabacaria_hero.png',
  },
  {
    id: 'adega',
    path: '/adega',
    icon: <GlassWater size={40} />,
    label: 'Adega',
    name: 'Adega do Vado — Bebidas',
    slogan: 'Bebida Gelada & Preço de Atacado',
    description:
      'A tradição da Vila Mineirão desde 2008. Cervejas, destilados e vinhos com o melhor atendimento.',
    tags: ['Cervejas', 'Whisky', 'Gin', 'Vinhos', 'Gelo & Carvão'],
    bgGlow: 'rgba(242,188,27,0.12)',
    bgGlow2: 'rgba(29,43,58,0.06)',
    accentColor: '#F2BC1B',
    accentLight: '#FFD700',
    borderColor: 'rgba(242,188,27,0.3)',
    gradientFrom: '#0D151D',
    gradientVia: '#1D2B3A',
    ctaGradient: 'linear-gradient(135deg, #F2BC1B 0%, #FFD700 100%)',
    shadowColor: 'rgba(242,188,27,0.35)',
    heroGradient: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.95) 100%)',
    bgImage: '/adega_hero.png',
  },
];

export const Landing: React.FC = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#050505' }}
    >
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(242,188,27,0.08) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 80% 50%, rgba(29,43,58,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <div
        className="text-center mb-14 relative z-10 px-4 animate-slide-up"
      >
        <div className="mb-6 flex justify-center">
          <img src="/logo.png" alt="Adega do Vado Logo" className="h-32 md:h-40 w-auto drop-shadow-2xl" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs uppercase tracking-widest mb-6">
          <span>Adega do Vado</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>Sorocaba — Vila Mineirão</span>
        </div>
        <h1
          className="font-bold text-white mb-3 leading-none drop-shadow-2xl"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}
        >
          Seja bem-vindo
        </h1>
        <p className="text-white/60 text-base max-w-md mx-auto font-medium" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          A tradição de Sorocaba em dois catálogos exclusivos.
        </p>
      </div>

      {/* Store Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl w-full px-4 md:px-8 relative z-10">
        {stores.map((store) => (
          <div
            key={store.id}
            className="animate-slide-up"
          >
            <Link
              to={store.path}
              id={`landing-${store.id}-btn`}
              className="group block relative rounded-3xl overflow-hidden border transition-all duration-500"
              style={{
                borderColor: store.borderColor,
                boxShadow: `0 0 0 0 ${store.shadowColor}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  `0 20px 60px -10px ${store.shadowColor}, 0 0 0 1px ${store.borderColor}`;
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 0 0 ${store.shadowColor}`;
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              }}
            >
              {/* Background image */}
              <div className="absolute inset-0">
                <img
                  src={store.bgImage}
                  alt={store.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60"
                />
                <div className="absolute inset-0" style={{ background: store.heroGradient }} />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 md:p-10 flex flex-col min-h-[420px] md:min-h-[500px] justify-between">
                {/* Top */}
                <div>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border shadow-2xl"
                    style={{
                      background: `rgba(0,0,0,0.6)`,
                      borderColor: store.borderColor,
                      color: store.accentLight,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {store.icon}
                  </div>

                  <div
                    className="text-xs uppercase tracking-[0.2em] font-black mb-3"
                    style={{ color: store.accentLight, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    {store.label}
                  </div>

                  <h2
                    className="font-bold text-white mb-2 leading-tight"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: 'clamp(1.6rem, 3vw, 2.3rem)',
                      textShadow: '0 4px 12px rgba(0,0,0,0.9)'
                    }}
                  >
                    {store.name}
                  </h2>

                  <p className="text-sm font-bold tracking-wide mb-1" style={{ color: store.accentLight, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {store.slogan}
                  </p>

                  <p className="text-white/80 text-sm leading-relaxed mt-4 max-w-xs font-medium" style={{ textShadow: '0 2px 8px rgba(0,0,0,1)' }}>
                    {store.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2 mb-8">
                    {store.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md"
                        style={{
                          borderColor: `${store.accentLight}40`,
                          color: '#fff',
                          background: 'rgba(0,0,0,0.5)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div
                    className="w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-black transition-all duration-300 group-hover:scale-[1.02]"
                    style={{
                      background: store.ctaGradient,
                      boxShadow: `0 8px 24px -8px ${store.shadowColor}`,
                    }}
                  >
                    <span>Entrar no Catálogo</span>
                    <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p
        className="text-white/20 text-xs mt-12 relative z-10 animate-fade-in"
      >
        © {new Date().getFullYear()} Adega do Vado — Desde 2008
      </p>
    </div>
  );
};
