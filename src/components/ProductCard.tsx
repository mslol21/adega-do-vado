import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onAdd?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const { addToCart } = useCart();
  const { theme } = useStore();

  const handleAdd = () => {
    addToCart(product);
    onAdd?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-500 h-full"
      style={{ 
        backgroundColor: theme.bgSecondary,
        borderColor: `${theme.accent}15`,
        boxShadow: '0 10px 30px -15px rgba(0,0,0,0.5)'
      }}
    >
      {/* Imagem do Produto */}
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(to top, ${theme.bgPrimary}CC, transparent)` }}
        />
        
        {/* Badge de Categoria/Subcategoria */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
          {product.subcategory && (
            <span 
              className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md self-start"
              style={{ background: `${theme.bgPrimary}80`, color: theme.accent, border: `1px solid ${theme.accent}30` }}
            >
              {product.subcategory}
            </span>
          )}
          {(product.stockQuantity === 0) && (
            <span 
              className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md self-start bg-red-500/80 text-white"
            >
              Esgotado
            </span>
          )}
          {product.promotionalPrice && product.promotionalPrice > 0 && product.stockQuantity !== 0 && (
            <span 
              className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md self-start"
              style={{ background: '#EF4444', color: '#fff', border: `1px solid #DC2626` }}
            >
              Oferta
            </span>
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="p-3 sm:p-5 space-y-2 sm:space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif font-bold text-sm sm:text-lg leading-tight line-clamp-1" style={{ color: '#fff' }}>
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-xs mt-1 line-clamp-2" style={{ color: theme.textMuted }}>
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest" style={{ color: theme.textMuted }}>Unidade</span>
            {product.promotionalPrice && product.promotionalPrice > 0 ? (
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs line-through" style={{ color: theme.textMuted }}>
                  R$ {product.price.toFixed(2)}
                </span>
                <span className="text-base sm:text-xl font-bold" style={{ color: '#EF4444' }}>
                  R$ {product.promotionalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-base sm:text-xl font-bold" style={{ color: theme.accent }}>
                R$ {product.price.toFixed(2)}
              </span>
            )}
            {product.wholesalePrice && (
              <span className="text-[8px] sm:text-[10px] font-black leading-tight mt-0.5" style={{ color: theme.accentLight }}>
                Atacado: R$ {product.wholesalePrice.toFixed(2)} <br className="sm:hidden" />({product.wholesaleMinQuantity}+ un)
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stockQuantity === 0}
            className={`w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shadow-lg ${product.stockQuantity === 0 ? 'opacity-20 cursor-not-allowed scale-90' : 'hover:scale-110 active:scale-95'}`}
            style={{ 
              background: product.stockQuantity === 0 ? '#444' : theme.gradientAccent, 
              color: product.stockQuantity === 0 ? '#888' : theme.bgPrimary,
              boxShadow: product.stockQuantity === 0 ? 'none' : theme.shadowAccent 
            }}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Overlay de "Ver Detalhes" no Hover */}
      <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-accent/20 rounded-3xl transition-all duration-500" 
           style={{ borderColor: `${theme.accent}20` }} />
    </motion.div>
  );
};
