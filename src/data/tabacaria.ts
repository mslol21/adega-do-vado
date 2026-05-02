import type { StoreConfig } from '../types/store';

export const TABACARIA_CONFIG: StoreConfig = {
  id: 'tabacaria',
  name: 'Adega do Vado — Tabacaria',
  slogan: 'Tudo para sua sessão e conveniência',
  whatsapp: '5515988320793',
  niche: 'Narguilé, Essências, Sedas e Conveniência em Sorocaba',
  instagram: 'adegadovado',
  tiktok: '@adegadovado',
  hero: {
    badge: 'Artigos para Tabacaria desde 2008',
    title: ['Qualidade e Preço', 'Justo em Sorocaba'],
    description:
      'As melhores essências, narguilés completos, sedas e acessórios. Tudo o que você precisa para sua sessão com o melhor preço da Vila Mineirão.',
    cta: 'Ver Ofertas',
    ctaSecondary: 'Falar no Zap',
    heroAlt: 'Adega do Vado — Tabacaria e Bebidas',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200',
    floatingBadgeTitle: 'Desde 2008',
    floatingBadgeSub: 'Qualidade Garantida',
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
      icon: 'Zap',
      title: 'Tradição desde 2008',
      description: 'Mais de 15 anos servindo a Vila Mineirão com os melhores preços.',
    },
    {
      icon: 'Tag',
      title: 'Bebidas e Tabaco',
      description: 'O melhor atacado e varejo de Sorocaba em um só lugar.',
    },
    {
      icon: 'MessageCircle',
      title: 'Zappeou, Pediu!',
      description: 'Atendimento rápido pelo WhatsApp. Peça agora!',
    },
  ],
  categories: [
    { id: 'charutos', name: 'Charutos', image: '/cat_charutos.png', subcategories: ['Todos', 'Nacionais', 'Importados'] },
    { id: 'narguilé', name: 'Narguilé', image: '/cat_narguile.png', subcategories: ['Todos', 'Completos', 'Essências', 'Carvão'] },
    { id: 'sedas', name: 'Sedas & Filtros', image: '/cat_sedas.png', subcategories: ['Todos', 'Orgânicas', 'King Size', 'Filtros'] },
    { id: 'isqueiros', name: 'Isqueiros', image: '/cat_isqueiros.png', subcategories: ['Todos', 'Maçarico', 'Zippo', 'Bic'] },
    { id: 'acessórios', name: 'Acessórios', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800', subcategories: ['Todos', 'Cortadores', 'Cinzeiros'] },
    { id: 'kits', name: 'Kits & Combos', image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800', subcategories: ['Monte seu Kit'] },
  ],
  products: [
    {
      id: 'ch1', name: 'Charuto Premium Nacional',
      description: 'Folha selecionada, corpo encorpado com notas amadeiradas.',
      price: 38.00, image: 'https://images.unsplash.com/photo-1527799820374-87f60cf4d41c?q=80&w=800',
      category: 'charutos', subcategory: 'Nacionais',
    },
    // ... rest of products remain the same
  ],
};
