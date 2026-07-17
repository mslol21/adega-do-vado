import React from 'react';
import { ArrowRight, Flame, GlassWater } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const iconMap: Record<string, React.ReactNode> = {
  Flame: <Flame size={28} />,
  GlassWater: <GlassWater size={28} />,
};

export const Hero: React.FC = () => {
  const store = useStore();
  const { theme, hero } = store;

  const scrollToCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="pt-28 lg:pt-32 pb-16 lg:pb-20 px-4 overflow-hidden relative lg:min-h-[85vh] flex items-center texture-overlay"
      style={{ backgroundColor: theme.bgPrimary }}
    >
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-[150px] pointer-events-none" style={{ background: theme.glowBg1 }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: theme.glowBg2 }} />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="text-left order-2 lg:order-1">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-xs mb-8 border tracking-widest uppercase animate-fade-in"
              style={{
                background: `${theme.cta}18`,
                color: theme.ctaLight,
                borderColor: `${theme.cta}40`,
              }}
            >
              {iconMap[store.id === 'tabacaria' ? 'Flame' : 'GlassWater']}
              <span>{hero.badge}</span>
            </div>

            {/* Title */}
            <h1
              className="font-serif font-bold mb-8 leading-[1.1] animate-slide-up"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', color: theme.textMutedLight }}
            >
              {hero.title[0]}{' '}
              <span style={{ color: theme.accent }}>
                {hero.title[1]}
              </span>
            </h1>

            {/* Description */}
            <p
              className="text-lg mb-10 max-w-xl leading-relaxed animate-slide-up"
              style={{ color: theme.textMuted }}
            >
              {hero.description}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up"
            >
              <button
                id="hero-cta-btn"
                onClick={scrollToCatalog}
                className="w-full sm:w-auto text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: theme.gradientCta,
                  boxShadow: theme.shadowCta,
                }}
              >
                {hero.cta}
                <ArrowRight size={22} />
              </button>
              <button
                onClick={scrollToCatalog}
                className="w-full sm:w-auto border px-8 py-5 rounded-2xl font-medium text-base transition-all"
                style={{
                  color: theme.accent,
                  borderColor: `${theme.accent}40`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${theme.accent}18`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                {hero.ctaSecondary}
              </button>
            </div>

            {/* Trust badges */}
            <div
              className="flex flex-wrap gap-6 mt-10 text-sm animate-fade-in"
              style={{ color: theme.textMuted }}
            >
              {['🚚 Envio para todo BR', '✅ Sem cadastro', '💬 Atendimento no Zap'].map(badge => (
                <span key={badge}>{badge}</span>
              ))}
            </div>
          </div>

          {/* Hero image */}
          <div
            className="relative order-1 lg:order-2 animate-fade-in"
          >
            <div
              className="relative aspect-video lg:aspect-[4/5] rounded-3xl lg:rounded-[40px] overflow-hidden shadow-2xl group"
              style={{ border: `1px solid ${theme.accent}30` }}
            >
              <img
                src={hero.image}
                alt={hero.heroAlt}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${theme.bgPrimary}99, transparent)` }}
              />
            </div>

            {/* Floating badge */}
            <div
              className="absolute -bottom-6 -left-6 p-5 rounded-3xl backdrop-blur-md shadow-2xl hidden md:block animate-bounce"
              style={{
                background: theme.bgSecondary,
                border: `1px solid ${theme.accent}30`,
                boxShadow: theme.shadowAccent,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: `${theme.accent}20`, color: theme.accentLight }}
                >
                  {store.id === 'tabacaria' ? <Flame size={24} /> : <GlassWater size={24} />}
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: theme.accent }}>
                    {hero.floatingBadgeTitle}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: theme.textMuted }}>
                    {hero.floatingBadgeSub}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
