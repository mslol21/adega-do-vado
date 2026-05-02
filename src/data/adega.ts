import type { StoreConfig } from '../types/store';

export const ADEGA_CONFIG: StoreConfig = {
  id: 'adega',
  name: 'Adega do Vado — Bebidas',
  slogan: 'Atacado e Varejo de Bebidas em Sorocaba',
  whatsapp: '5515988320793',
  niche: 'Bebidas, Gelo, Carvão e Artigos de Conveniência',
  instagram: 'adegadovado',
  tiktok: '@adegadovado',
  hero: {
    badge: 'Sua Adega em Sorocaba desde 2008',
    title: ['Bebida Gelada e', 'Preço de Atacado'],
    description:
      'Cervejas, vinhos, destilados e artigos para tabacaria. A tradição da Vila Mineirão com o melhor atendimento de Sorocaba.',
    cta: 'Ver Catálogo',
    ctaSecondary: 'Chamar no Zap',
    heroAlt: 'Adega do Vado — Vinhos & Bebidas',
    image: '/adega_hero.png',
    floatingBadgeTitle: '15+ Anos',
    floatingBadgeSub: 'De Tradição em Sorocaba',
  },
  theme: {
    accent: '#F2BC1B', // Amarelo da Logo
    accentLight: '#FFD700',
    accentDark: '#B8860B',
    cta: '#F2BC1B',
    ctaLight: '#FFD700',
    bgPrimary: '#0D151D', // Navy Profundo
    bgSecondary: '#1D2B3A', // Navy da Logo
    bgMid: '#253445',
    textMuted: '#94A3B8',
    textMutedLight: '#CBD5E1',
    gradientAccent: 'linear-gradient(135deg, #F2BC1B 0%, #FFD700 100%)',
    gradientCta: 'linear-gradient(135deg, #F2BC1B 0%, #FFD700 100%)',
    shadowAccent: '0 10px 30px -10px rgba(242,188,27,0.35)',
    shadowCta: '0 10px 30px -10px rgba(242,188,27,0.4)',
    glowBg1: 'rgba(242,188,27,0.08)',
    glowBg2: 'rgba(29,43,58,0.1)',
  },
  benefits: [
    {
      icon: 'GlassWater',
      title: 'Bebida Gelada',
      description: 'Garantimos a temperatura ideal para o seu evento ou consumo imediato.',
    },
    {
      icon: 'ShieldCheck',
      title: 'Atacado e Varejo',
      description: 'Preços especiais para festas e comércios de Sorocaba.',
    },
    {
      icon: 'Truck',
      title: 'Tradição Local',
      description: 'Desde 2008 servindo a Vila Mineirão com qualidade e respeito.',
    },
  ],
  categories: [
    { id: 'vinhos', name: 'Vinhos', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800', subcategories: ['Todos', 'Tinto', 'Branco', 'Rosé', 'Espumante'] },
    { id: 'destilados', name: 'Destilados', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=800', subcategories: ['Todos', 'Whisky', 'Gin', 'Vodka', 'Rum', 'Cachaça Premium'] },
    { id: 'cervejas', name: 'Cervejas', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=800', subcategories: ['Todos', 'Pilsen', 'Artesanais', 'Lata', 'Garrafa'] },
    { id: 'espumantes', name: 'Champagne', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800', subcategories: ['Todos', 'Brut', 'Moscatel'] },
    { id: 'acessórios', name: 'Conveniência', image: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=800', subcategories: ['Todos', 'Gelo', 'Carvão', 'Copos'] },
    { id: 'kits', name: 'Kits Presente', image: 'https://images.unsplash.com/photo-1535443274868-756b0f070b6e?q=80&w=800', subcategories: ['Monte seu Kit'] },
  ],
  products: [
    // ... products
  ],
};
