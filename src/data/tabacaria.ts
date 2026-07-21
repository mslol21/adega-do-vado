import type { StoreConfig } from '../types/store';

export const TABACARIA_CONFIG: StoreConfig = {
  id: 'tabacaria',
  name: 'Henri Imports Tabaca',
  logo: '/logo_tabacaria.png',
  slogan: 'Vapes, Narguilés & Acessórios Premium',
  whatsapp: '5515996955018',
  niche: 'Vapes, Narguilés, Sedas e Acessórios Importados em Sorocaba',
  instagram: 'henriimports',
  tiktok: '@henriimports',
  storeCep: '18080-000',
  deliveryFeePerKm: 1.50,
  deliveryBaseFee: 5.00,
  deliveryInfo: 'Entregamos em Sorocaba e Votorantim. A taxa é calculada por km (R$ 1,50/km + R$ 5 fixo).',
  hero: {
    badge: 'Artigos Importados Premium',
    title: ['Henri Imports', 'Tabacaria'],
    description:
      'Os melhores vapes, narguilés completos, sedas e acessórios importados. Tudo o que você precisa com o melhor preço de Sorocaba.',
    cta: 'Ver Produtos',
    ctaSecondary: 'Falar no Zap',
    heroAlt: 'Henri Imports Tabacaria — Vapes e Narguilés',
    image: '/tabacaria_hero.png?v=3',
    floatingBadgeTitle: 'Importados',
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
      title: 'Vapes & Narguilés',
      description: 'As melhores marcas de vapes, pods e narguilés importados.',
    },
    {
      icon: 'Tag',
      title: 'Sedas & Acessórios',
      description: 'Tudo para sua sessão com a melhor qualidade e preço.',
    },
    {
      icon: 'MessageCircle',
      title: 'Zappeou, Chegou!',
      description: 'Atendimento rápido pelo WhatsApp. Faça seu pedido agora!',
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
      id: '550e8400-e29b-41d4-a716-446655440000', name: 'Charuto Premium Nacional',
      description: 'Folha selecionada, corpo encorpado com notas amadeiradas.',
      price: 38.00, image: 'https://images.unsplash.com/photo-1527799820374-87f60cf4d41c?q=80&w=800',
      category: 'charutos', subcategory: 'Nacionais',
    },
    // ... rest of products remain the same
  ],
};
