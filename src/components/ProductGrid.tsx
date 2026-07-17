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
      if (!selectedCategory) return false; // Don't show products if no category is selected and no search
      
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
  };

  // Determine what view to show
  const isSearching = searchQuery.length > 0;
  const showCategoryGrid = !isSearching && !selectedCategory;

  return (
    <section id="catalog" className="py-20 px-4 min-h-screen" style={{ backgroundColor: theme.bgPrimary }}>
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            {(selectedCategory || isSearching) ? (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  // If we were searching, clearing search is handled by Navbar, 
                  // but we should ensure we return to category grid.
                }}
                className="flex items-center gap-2 text-sm font-medium mb-3 transition-all hover:opacity-80"
                style={{ color: theme.accent }}
              >
                <ChevronLeft size={18} /> Todas as categorias
              </button>
            ) : null}
            <h2 className="text-4xl font-serif font-bold" style={{ color: theme.accent }}>
              {isSearching ? 'Resultados da Busca' : (selectedCategory ? activeCategory?.name : 'Categorias')}
            </h2>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {isSearching 
                ? `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''} para "${searchQuery}"`
                : (selectedCategory
                  ? `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`
                  : 'Selecione uma categoria para explorar')}
            </p>
          </div>

          {(selectedCategory && !isSearching) && (
            <button onClick={() => setSelectedCategory(null)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ borderColor: `${theme.accent}30`, color: theme.textMuted }}>
              <LayoutGrid size={14} /> Ver todas
            </button>
          )}
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
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 animate-slide-up"
              >
              {categories.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="group relative rounded-2xl overflow-hidden text-left focus:outline-none animate-fade-in"
                  style={{ border: `1px solid ${theme.accent}20` }}
                >
                  {/* Photo */}
                  <div className="aspect-[4/3] overflow-hidden relative">
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
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <div className="font-serif font-bold text-2xl leading-tight drop-shadow-lg" style={{ color: '#fff' }}>
                      {cat.name}
                    </div>
                    {cat.subcategories && cat.subcategories.length > 1 && (
                      <div className="text-[10px] mt-1 opacity-90 font-medium uppercase tracking-[0.1em]" style={{ color: theme.accentLight }}>
                        {cat.subcategories.filter(s => s !== 'Todos').slice(0, 2).join(' · ')}
                        {cat.subcategories.length > 3 && ' ...'}
                      </div>
                    )}
                    {/* Arrow indicator */}
                    <div
                      className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all group-hover:bg-white group-hover:text-black self-start"
                      style={{ background: theme.gradientAccent, color: theme.bgPrimary }}
                    >
                      Explorar <ArrowRight size={12} />
                    </div>
                  </div>
                </button>
              ))}
              </div>
            </div>
          )}

          {/* ── PRODUCT LISTING ──────────────────────── */}
          {(selectedCategory || isSearching) && (
            <div key="prod-list"
              className="animate-slide-up"
            >
              {/* Subcategory pills - only if not searching or if category is explicitly selected */}
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
          )}

        </div>
      </div>
    </section>
  );
};
