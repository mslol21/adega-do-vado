import React, { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, LayoutGrid, ArrowRight } from 'lucide-react';

interface ProductGridProps {
  searchQuery?: string;
  onAddItem?: (name: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ searchQuery = '', onAddItem }) => {
  const { products, categories } = useData();
  const { theme } = useStore();

  // null = showing category grid; string = selected category id
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
      if (!selectedCategory) return active; // Show all products if no category is selected
      
      const catMatch = p.category === selectedCategory;
      const subMatch =
        selectedSubcategory === 'Todos' ||
        selectedSubcategory === 'Monte seu Kit' ||
        p.subcategory === selectedSubcategory;
      
      return active && catMatch && subMatch;
    });
  }, [products, selectedCategory, selectedSubcategory, searchQuery]);

  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    setSelectedSubcategory('Todos');
    
    // Smooth scroll to products section
    setTimeout(() => {
      const prodList = document.getElementById('prod-list');
      if (prodList) {
        const y = prodList.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 10);
  };

  // Determine what view to show
  const isSearching = searchQuery.length > 0;
  const showCategoryGrid = !isSearching;

  return (
    <section id="catalog" className="py-20 px-4 min-h-screen" style={{ backgroundColor: theme.bgPrimary }}>
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-4xl font-serif font-bold" style={{ color: theme.accent }}>
              {isSearching ? 'Resultados da Busca' : 'Categorias'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {isSearching 
                ? `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''} para "${searchQuery}"`
                : 'Explore nosso catálogo premium'}
            </p>
          </div>
        </div>

        <div>

          {/* ── CATEGORY GRID (visual cards) ─────────── */}
          {showCategoryGrid && (
            <div className="space-y-16">
              {/* Promoções */}
              {promoProducts.length > 0 && (
                <div key="promo-grid"
                  className="animate-slide-up"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-8 h-1 rounded-full" style={{ background: '#EF4444' }} />
                    <h3 className="text-2xl font-serif font-bold text-white">Ofertas Especiais</h3>
                    <span className="w-8 h-1 rounded-full" style={{ background: '#EF4444' }} />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
                    {promoProducts.map(product => (
                      <ProductCard key={product.id} product={product} onAdd={() => onAddItem?.(product.name)} />
                    ))}
                  </div>
                </div>
              )}

              <div key="cat-grid"
                className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 animate-slide-up"
              >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="group relative rounded-2xl overflow-hidden text-left focus:outline-none animate-fade-in"
                  style={{ border: `1px solid ${theme.accent}20` }}
                >
                  {/* Photo */}
                  <div className="aspect-square overflow-hidden relative">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: theme.bgMid }} />
                    )}
                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, ${theme.bgPrimary}EE 0%, ${theme.bgPrimary}60 50%, transparent 100%)`,
                      }}
                    />
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `${theme.accent}15` }}
                    />
                  </div>

                  {/* Label */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                    <div className="font-serif font-bold text-sm md:text-lg leading-tight drop-shadow-lg" style={{ color: '#fff' }}>
                      {cat.name}
                    </div>
                    {cat.subcategories && cat.subcategories.length > 1 && (
                      <div className="hidden md:block text-[8px] mt-1 opacity-90 font-medium uppercase tracking-[0.1em]" style={{ color: theme.accentLight }}>
                        {cat.subcategories.filter(s => s !== 'Todos').slice(0, 1).join(' · ')}
                        {cat.subcategories.length > 2 && ' ...'}
                      </div>
                    )}
                  </div>
                </button>
              ))}
              </div>
            </div>
          )}

          {/* ── PRODUCT LISTING ──────────────────────── */}
          <div id="prod-list" className={`animate-slide-up ${!isSearching ? 'mt-16 pt-12 border-t' : ''}`} style={{ borderColor: `${theme.accent}15` }}>
            
            {!isSearching && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold" style={{ color: theme.accent }}>
                    {selectedCategory ? activeCategory?.name : 'Todos os Produtos'}
                  </h2>
                  <p className="mt-1 text-xs uppercase tracking-widest font-bold" style={{ color: theme.textMuted }}>
                    {filteredProducts.length} itens
                  </p>
                </div>
                {selectedCategory && (
                  <button onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory('Todos');
                  }}
                    className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full border transition-all hover:bg-white/5 self-start sm:self-auto"
                    style={{ color: theme.textMuted, borderColor: `${theme.accent}20` }}>
                    Limpar Filtro
                  </button>
                )}
              </div>
            )}

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

              {/* Products */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
                  {filteredProducts.map(product => (
                    <div key={product.id}
                      className="animate-fade-in"
                    >
                      <ProductCard product={product} onAdd={() => onAddItem?.(product.name)} />
                    </div>
                  ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-24">
                  <p className="text-lg font-serif italic" style={{ color: `${theme.accent}40` }}>
                    Nenhum produto encontrado.
                  </p>
                </div>
              )}
          </div>

        </div>
      </div>
    </section>
  );
};
