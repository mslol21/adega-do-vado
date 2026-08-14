import type { Product, CartItem } from '../types';

/**
 * Retorna o preço unitário efetivo do produto/item do carrinho,
 * aplicando regras de preço de atacado e preço promocional se disponíveis.
 */
export const getItemUnitPrice = (item: Product | CartItem, quantity?: number): number => {
  const qty = quantity ?? ('quantity' in item ? (item as CartItem).quantity : 1);
  const basePromo = (item.promotionalPrice && item.promotionalPrice > 0) ? item.promotionalPrice : item.price;
  const isWholesale = Boolean(item.wholesalePrice && item.wholesaleMinQuantity && qty >= item.wholesaleMinQuantity);
  
  if (isWholesale && item.wholesalePrice) {
    return Math.min(item.wholesalePrice, basePromo);
  }
  return basePromo;
};

/**
 * Retorna o preço total de um item do carrinho (preço unitário * quantidade).
 */
export const getItemTotalPrice = (item: CartItem): number => {
  return getItemUnitPrice(item) * item.quantity;
};
