import fs from 'fs';

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWJzZ29hb2Z4dXFrZHhuYmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NjQ1NTcsImV4cCI6MjA5MzI0MDU1N30.FVya6LUVYGbfK7n3sZmSa9JagFm1I4UjUU-SCtuWHQk';

async function run() {
  const catRes = await fetch('https://ksabsgoaofxuqkdxnblp.supabase.co/rest/v1/categories?store_id=eq.tabacaria', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  const categories = await catRes.json();

  const prodRes = await fetch('https://ksabsgoaofxuqkdxnblp.supabase.co/rest/v1/products?store_id=eq.tabacaria&order=id.asc&limit=200', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  const rawProducts = await prodRes.json();

  const mappedProducts = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price ? parseFloat(String(p.price).replace(',', '.')) : 0,
    promotionalPrice: p.promotional_price ? parseFloat(String(p.promotional_price).replace(',', '.')) : undefined,
    wholesalePrice: p.wholesale_price ? parseFloat(String(p.wholesale_price).replace(',', '.')) : undefined,
    wholesaleMinQuantity: p.wholesale_min_quantity ? parseInt(String(p.wholesale_min_quantity), 10) : undefined,
    stockQuantity: p.stock_quantity ? parseInt(String(p.stock_quantity), 10) : 0,
    image: (p.image && p.image.length > 500000) ? '' : (p.image || ''),
    category: p.category || '',
    subcategory: p.subcategory || 'Todos',
    isActive: p.is_active !== false,
    flavors: p.available_colors || undefined,
    variations: p.variations || [],
  }));

  console.log('Got', categories.length, 'categories and', mappedProducts.length, 'products for tabacaria.');

  const mappedCats = categories.map(c => ({
    id: c.id,
    name: c.name.trim(),
    image: c.image || '',
    subcategories: c.subcategories || ['Todos'],
  }));

  const fileContent = `import type { StoreConfig } from '../types/store';

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
    accent: '#F2BC1B',
    accentLight: '#FFD700',
    accentDark: '#B8860B',
    cta: '#F2BC1B',
    ctaLight: '#FFD700',
    bgPrimary: '#0D151D',
    bgSecondary: '#1D2B3A',
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
  categories: ${JSON.stringify(mappedCats, null, 2)},
  products: ${JSON.stringify(mappedProducts, null, 2)},
};
`;

  fs.writeFileSync('src/data/tabacaria.ts', fileContent, 'utf-8');
  console.log('src/data/tabacaria.ts updated successfully!');
}
run();
