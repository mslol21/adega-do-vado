import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Search, Plus, Minus, Sparkles } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { getProductFlavors } from '../utils/flavors';
import { getItemUnitPrice } from '../utils/price';

interface ProductFlavorModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (flavor: string, quantity: number) => void;
}

export const ProductFlavorModal: React.FC<ProductFlavorModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { addToCart, cart } = useCart();
  const { theme } = useStore();

  const flavorOptions = useMemo(() => {
    return product ? getProductFlavors(product) : [];
  }, [product]);

  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    if (isOpen && product) {
      const flavors = getProductFlavors(product);
      setSelectedFlavor(flavors.length > 0 ? flavors[0] : '');
      setQuantity(1);
      setSearchFilter('');
    }
  }, [isOpen, product]);

  // Bloqueia scroll do body enquanto o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const filteredFlavors = flavorOptions.filter(f =>
    f.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const unitPrice = getItemUnitPrice(product, quantity, cart);
  const totalPrice = unitPrice * quantity;
  const hasDiscount = unitPrice < Number(product.price);

  const handleAdd = () => {
    if (flavorOptions.length > 0 && !selectedFlavor) {
      return;
    }
    addToCart({ ...product, selectedFlavor }, quantity);
    onConfirm?.(selectedFlavor, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop com blur */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Container do Modal */}
      <div 
        className="relative w-full max-w-lg bg-[#0F1722] border sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-slide-up"
        style={{ borderColor: `${theme.accent}30`, backgroundColor: theme.bgSecondary }}
      >
        {/* Barra superior Mobile Pull Indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header com Informações do Produto */}
        <div className="p-4 sm:p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: `${theme.accent}15` }}>
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 border bg-black/40 shadow-inner"
                 style={{ borderColor: `${theme.accent}20` }}>
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              {product.subcategory && (
                <span 
                  className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest self-start inline-block mb-1"
                  style={{ background: `${theme.bgPrimary}90`, color: theme.accent, border: `1px solid ${theme.accent}30` }}
                >
                  {product.subcategory}
                </span>
              )}
              <h3 className="font-serif font-bold text-base sm:text-lg leading-tight text-white line-clamp-2">
                {product.name}
              </h3>
              
              {/* Preço Unitário */}
              <div className="flex items-baseline gap-2 mt-1.5">
                {hasDiscount && (
                  <span className="text-xs line-through opacity-50 font-bold" style={{ color: theme.textMuted }}>
                    {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
                <span className="font-bold text-base sm:text-lg" style={{ color: theme.accent }}>
                  {unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                {product.wholesalePrice && Number(product.wholesalePrice) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400">
                    (Atacado: R$ {Number(product.wholesalePrice).toFixed(2)} a partir de {product.wholesaleMinQuantity || 1} un)
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal - Lista de Sabores */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} style={{ color: theme.accent }} />
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                Escolha o Sabor / Opção
              </h4>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              1 Obrigatório
            </span>
          </div>

          {/* Campo de Busca (se houver mais de 5 sabores) */}
          {flavorOptions.length > 5 && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Pesquisar sabor desejado..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent transition-all"
                style={{ borderColor: `${theme.accent}20` }}
              />
            </div>
          )}

          {/* Grid de Opções de Sabores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredFlavors.map((flavor) => {
              const isSelected = selectedFlavor === flavor;

              return (
                <button
                  key={flavor}
                  type="button"
                  onClick={() => setSelectedFlavor(flavor)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-300 relative group cursor-pointer ${
                    isSelected 
                      ? 'scale-[1.02] shadow-lg' 
                      : 'hover:border-white/20 hover:bg-white/5 opacity-90'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${theme.bgPrimary}DD` : `${theme.bgPrimary}60`,
                    borderColor: isSelected ? theme.accent : `${theme.accent}15`,
                    boxShadow: isSelected ? `0 0 20px ${theme.accent}25` : 'none'
                  }}
                >
                  <div className="flex items-center gap-3 pr-2">
                    <div 
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-transparent' : 'border-white/30'
                      }`}
                      style={{
                        backgroundColor: isSelected ? theme.accent : 'transparent',
                        color: isSelected ? theme.bgPrimary : 'transparent'
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3.5} />}
                    </div>
                    <span className={`text-xs sm:text-sm font-bold transition-colors ${
                      isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'
                    }`}>
                      {flavor}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                          style={{ background: `${theme.accent}20`, color: theme.accent }}>
                      Selecionado
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredFlavors.length === 0 && (
            <div className="text-center py-8 text-white/40 text-xs">
              Nenhum sabor encontrado para &quot;{searchFilter}&quot;.
            </div>
          )}
        </div>

        {/* Footer com Quantidade e CTA */}
        <div className="p-4 sm:p-6 border-t bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4"
             style={{ borderColor: `${theme.accent}15` }}>
          {/* Seletor de Quantidade */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="text-xs font-bold text-white/70 sm:hidden">Quantidade:</span>
            <div className="flex items-center gap-4 px-4 py-2 rounded-2xl border shadow-inner bg-black/60"
                 style={{ borderColor: `${theme.accent}20` }}>
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                className="transition-all active:scale-75 disabled:opacity-30 text-white/70 hover:text-white p-1"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="text-sm font-black w-6 text-center tabular-nums text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(prev => prev + 1)}
                className="transition-all active:scale-75 text-white/70 hover:text-white p-1"
                style={{ color: theme.accent }}
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Botão de Adicionar */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={flavorOptions.length > 0 && !selectedFlavor}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: theme.gradientAccent,
              color: theme.bgPrimary,
              boxShadow: theme.shadowAccent
            }}
          >
            <span>
              {selectedFlavor ? `Adicionar ${quantity}x ao Carrinho` : 'Selecione um Sabor'}
            </span>
            <span className="opacity-40">•</span>
            <span className="font-black tabular-nums">
              {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
