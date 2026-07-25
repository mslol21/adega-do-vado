import React, { useState, useMemo, useRef } from 'react';
import { ProductCard } from './ProductCard';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Product } from '../types';

interface ProductGridProps {
  searchQuery?: string;
  onAddItem?: (name: string) => void;
}

const CategoryRow = ({ title, products, onAdd, onSeeMore, isPromo = false }: { title: string, products: Product[], onAdd?: (name: string) => void, onSeeMore?: () => void, isPromo?: boolean }) => {
  const { theme } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="animate-slide-up mb-12 relative group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 rounded-full" style={{ background: isPromo ? '#EF4444' : theme.accent }} />
          <h3 className="text-xl sm:text-2xl font-serif font-bold" style={{ color: isPromo ? '#fff' : theme.accent }}>{title}</h3>
        </div>
        
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {onSeeMore && (
            <button onClick={onSeeMore} className="text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all hover:bg-white/5" style={{ color: theme.accent, borderColor: `${theme.accent}30` }}>
              Ver Todos <ArrowRight size={14} />
            </button>
          )}
          <div className="hidden sm:flex gap-2">
            <button onClick={() => scroll(-1)} className="p-2 rounded-full border transition-all hover:bg-white/10 active:scale-95" style={{ borderColor: `${theme.accent}30`, color: theme.accent }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scroll(1)} className="p-2 rounded-full border transition-all hover:bg-white/10 active:scale-95" style={{ borderColor: `${theme.accent}30`, color: theme.accent }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="grid grid-flow-col auto-cols-[calc(50%-6px)] sm:auto-cols-[calc(33.333%-16px)] md:auto-cols-[calc(33.333%-21px)] lg:auto-cols-[calc(25%-24px)] gap-3 sm:gap-6 md:gap-8 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {products.map(product => (
          <div key={product.id} className="snap-start relative h-full">
            <ProductCard product={product} onAdd={() => onAdd?.(product.name)} isPromo={isPromo} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProductGrid: React.FC<ProductGridProps> = ({ searchQuery = '', onAddItem }) => {
  const { products, categories } = useData();
  const { theme } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState('Todos');

  const activeCategory = categories.find(c => c.id === selectedCategory);

  const promoProducts = useMemo(() => 
    products.filter(p => p.promotionalPrice && p.promotionalPrice > 0 && p.isActive !== false),
  [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    return products.filter(p => {
      const active = p.isActive !== false;
      
      // If there's a search query, search across everything
      if (query) {
        const nameMatch = p.name.toLowerCase().includes(query);
        const descMatch = p.description?.toLowerCase().includes(query);
        const catMatch = p.category?.toLowerCase().includes(query);
        return active && (nameMatch || descMatch || catMatch);
      }

      // Normal navigation
      if (!selectedCategory) return active;
      
      const catMatch = p.category === selectedCategory;
      const subMatch =
        selectedSubcategory === 'Todos' ||
        selectedSubcategory === 'Monte seu Kit' ||
        p.subcategory === selectedSubcategory;
      
      return active && catMatch && subMatch;
    });
  }, [products, selectedCategory, selectedSubcategory, searchQuery]);

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategory(id);
    setSelectedSubcategory('Todos');
    
    // Smooth scroll to catalog section
    setTimeout(() => {
      const el = document.getElementById('catalog');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 10);
  };

  const isSearching = searchQuery.length > 0;
  
  // Se está na tela inicial sem busca, mostramos as fileiras. Caso contrário, mostramos a grade de resultados/categoria.
  const isHomeView = !isSearching && !selectedCategory;

  return (
    <section id="catalog" className="py-12 md:py-20 px-4 min-h-screen" style={{ backgroundColor: theme.bgPrimary }}>
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────── */}
        {!isHomeView && (
          <div className="flex items-center justify-between mb-10 animate-fade-in">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: theme.accent }}>
                {isSearching ? 'Resultados da Busca' : activeCategory?.name}
              </h2>
              <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>
                {isSearching 
                  ? `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''} para "${searchQuery}"`
                  : `${filteredProducts.length} itens disponíveis nesta categoria`}
              </p>
            </div>
            {selectedCategory && (
              <button onClick={() => handleSelectCategory(null)}
                className="text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-2 md:px-5 md:py-2.5 rounded-full border transition-all hover:bg-white/5"
                style={{ color: theme.textMuted, borderColor: `${theme.accent}20` }}>
                Voltar
              </button>
            )}
          </div>
        )}

        {/* ── HOME VIEW (CAROUSEL ROWS) ────────────── */}
        {isHomeView && (
          <div className="space-y-4">
            <CategoryRow 
              title="Ofertas Especiais" 
              products={promoProducts} 
              onAdd={onAddItem} 
              isPromo={true} 
            />
            
            {categories.map(category => {
              const catProducts = products.filter(p => p.category === category.id && p.isActive !== false);
              return (
                <CategoryRow 
                  key={category.id}
                  title={category.name}
                  products={catProducts}
                  onAdd={onAddItem}
                  onSeeMore={() => handleSelectCategory(category.id)}
                />
              );
            })}
          </div>
        )}

        {/* ── CATEGORY VIEW OR SEARCH RESULTS (GRID) ── */}
        {!isHomeView && (
          <div className="animate-slide-up">
            {/* Subcategory pills - only if category is explicitly selected */}
            {selectedCategory && !isSearching && activeCategory?.subcategories && activeCategory.subcategories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {activeCategory.subcategories.map(sub => (
                  <button key={sub} onClick={() => setSelectedSubcategory(sub)}
                    className="px-4 py-2 rounded-full text-xs font-bold border transition-all"
                    style={selectedSubcategory === sub
                      ? { background: theme.gradientAccent, color: theme.bgPrimary, borderColor: 'transparent' }
                      : { background: 'transparent', color: theme.textMuted, borderColor: `${theme.accent}20` }
                    }
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
                {filteredProducts.map(product => (
                  <div key={product.id} className="animate-fade-in h-full">
                    <ProductCard product={product} onAdd={() => onAddItem?.(product.name)} />
                  </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-24 border rounded-3xl" style={{ borderColor: `${theme.accent}15`, background: 'rgba(0,0,0,0.2)' }}>
                <p className="text-lg font-serif italic" style={{ color: `${theme.accent}40` }}>
                  Nenhum produto encontrado.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
