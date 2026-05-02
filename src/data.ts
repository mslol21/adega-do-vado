export const COMPANY_DATA = {
  name: "Tabacaria Calixto",
  whatsapp: "5511999999999",
  niche: "Charutos, Narguilé & Acessórios Premium",
  instagram: "tabacariacalixto",
  tiktok: "@tabacariacalixto",
  slogan: "A arte de apreciar o bom tabaco"
};

export const CATEGORIES = [
  { id: 'charutos', name: 'Charutos', subcategories: ['Todos', 'Nacionais', 'Importados', 'Charutos de Festa'] },
  { id: 'narguilé', name: 'Narguilé', subcategories: ['Todos', 'Narguile Completo', 'Essências', 'Mangueiras', 'Vasos'] },
  { id: 'sedas', name: 'Sedas & Filtros', subcategories: ['Todos', 'Sedas Orgânicas', 'Sedas King Size', 'Filtros'] },
  { id: 'isqueiros', name: 'Isqueiros', subcategories: ['Todos', 'Maçarico', 'Recarregável', 'Colecionável'] },
  { id: 'acessórios', name: 'Acessórios', subcategories: ['Todos', 'Cortadores', 'Cinzeiros', 'Cases'] },
  { id: 'kits', name: 'Kits & Combos', subcategories: ['Monte seu Kit'] },
];

export const INITIAL_PRODUCTS = [
  // Charutos
  {
    id: "ch1",
    name: "Charuto Premium Nacional",
    description: "Folha selecionada, corpo encorpado com notas amadeiradas e terrosas.",
    price: 38.00,
    image: "https://images.unsplash.com/photo-1527799820374-87f60cf4d41c?q=80&w=800",
    category: 'charutos',
    subcategory: 'Nacionais'
  },
  {
    id: "ch2",
    name: "Charuto Importado Cuba Series",
    description: "Blend cubano de 5 anos de maturação, aroma suave e persistente.",
    price: 120.00,
    image: "https://images.unsplash.com/photo-1527799820374-87f60cf4d41c?q=80&w=800",
    category: 'charutos',
    subcategory: 'Importados'
  },
  {
    id: "ch3",
    name: "Charuto de Festa — Caixa 10un",
    description: "Ideal para eventos e celebrações. Embalagem presente inclusa.",
    price: 280.00,
    image: "https://images.unsplash.com/photo-1527799820374-87f60cf4d41c?q=80&w=800",
    category: 'charutos',
    subcategory: 'Charutos de Festa'
  },

  // Narguilé
  {
    id: "na1",
    name: "Narguile Completo Black Edition",
    description: "Vaso em vidro soprado, haste em aço inox escovado, mangueira em silicone premium.",
    price: 349.00,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800",
    category: 'narguilé',
    subcategory: 'Narguile Completo'
  },
  {
    id: "na2",
    name: "Essência Al Fakher — Dupla Maçã",
    description: "250g. Sabor clássico de dupla maçã, fumaça densa e longa duração.",
    price: 55.00,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800",
    category: 'narguilé',
    subcategory: 'Essências'
  },
  {
    id: "na3",
    name: "Mangueira Silicone Premium KM",
    description: "1,80m, lavável, inodora. Anti-chamas e ultra-resistente.",
    price: 89.00,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800",
    category: 'narguilé',
    subcategory: 'Mangueiras'
  },

  // Sedas
  {
    id: "se1",
    name: "Seda Orgânica Raw Classic",
    description: "70 folhas. Sem cloro, 100% natural, queima lenta e uniforme.",
    price: 12.00,
    image: "https://images.unsplash.com/photo-1610444654921-65487f54c9c0?q=80&w=800",
    category: 'sedas',
    subcategory: 'Sedas Orgânicas'
  },
  {
    id: "se2",
    name: "Seda King Size Ultra Thin",
    description: "33 folhas extra-largas. Papel de arroz ultrafino.",
    price: 8.00,
    image: "https://images.unsplash.com/photo-1610444654921-65487f54c9c0?q=80&w=800",
    category: 'sedas',
    subcategory: 'Sedas King Size'
  },

  // Isqueiros
  {
    id: "is1",
    name: "Isqueiro Maçarico Dupla Chama",
    description: "Turbo jet flame, recarregável a gás. Ideal para charutos e cachimbos.",
    price: 75.00,
    image: "https://images.unsplash.com/photo-1533022139390-e31c488d69e2?q=80&w=800",
    category: 'isqueiros',
    subcategory: 'Maçarico'
  },
  {
    id: "is2",
    name: "Isqueiro Colecionável Zippo — Black Ice",
    description: "Acabamento espelhado preto, acompanha fluido e pederneira extras.",
    price: 180.00,
    image: "https://images.unsplash.com/photo-1533022139390-e31c488d69e2?q=80&w=800",
    category: 'isqueiros',
    subcategory: 'Colecionável'
  },

  // Acessórios
  {
    id: "ac1",
    name: "Cortador Guilhotina Premium",
    description: "Lâmina dupla em aço inox, corte limpo e preciso até 54 ring.",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1533022139390-e31c488d69e2?q=80&w=800",
    category: 'acessórios',
    subcategory: 'Cortadores'
  },
  {
    id: "ac2",
    name: "Cinzeiro de Mesa Vidro Fumê",
    description: "Cristal borossilicato, design esculpido, 4 apoios.",
    price: 60.00,
    image: "https://images.unsplash.com/photo-1533022139390-e31c488d69e2?q=80&w=800",
    category: 'acessórios',
    subcategory: 'Cinzeiros'
  },

  // Kit
  {
    id: "kt1",
    name: "Monte seu Kit",
    description: "Escolha seda, filtro, isqueiro e acessórios para o seu kit personalizado.",
    price: 80.00,
    image: "https://images.unsplash.com/photo-1527799820374-87f60cf4d41c?q=80&w=800",
    category: 'kits',
    subcategory: 'Monte seu Kit',
    isCustomizable: true
  }
];
