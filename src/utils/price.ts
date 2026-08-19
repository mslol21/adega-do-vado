import type { Product, CartItem } from '../types';

/**
 * Retorna o preço unitário efetivo do produto/item do carrinho,
 * aplicando regras de preço de atacado e preço promocional se disponíveis.
 * Se allCartItems for fornecido, a quantidade total do mesmo produto no carrinho
 * (mesmo que dividido em múltiplos sabores/variações) é somada para aplicar a regra de atacado.
 */
export const getItemUnitPrice = (
  item: Product | CartItem,
  quantity?: number,
  allCartItems?: CartItem[]
): number => {
  let qty = quantity;
  if (qty === undefined) {
    if (allCartItems && item.id) {
      const sameItems = allCartItems.filter(i => i.id === item.id);
      qty = sameItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
    } else {
      qty = Number('quantity' in item ? (item as CartItem).quantity : 1);
    }
  }

  const priceNum = Number(item.price) || 0;
  const promoPriceNum =
    item.promotionalPrice !== undefined &&
    item.promotionalPrice !== null &&
    !isNaN(Number(item.promotionalPrice)) &&
    Number(item.promotionalPrice) > 0
      ? Number(item.promotionalPrice)
      : undefined;

  const basePrice = promoPriceNum !== undefined ? promoPriceNum : priceNum;

  const wholesalePriceNum =
    item.wholesalePrice !== undefined &&
    item.wholesalePrice !== null &&
    !isNaN(Number(item.wholesalePrice)) &&
    Number(item.wholesalePrice) > 0
      ? Number(item.wholesalePrice)
      : undefined;

  const wholesaleMinQtyNum =
    item.wholesaleMinQuantity !== undefined &&
    item.wholesaleMinQuantity !== null &&
    !isNaN(Number(item.wholesaleMinQuantity)) &&
    Number(item.wholesaleMinQuantity) > 0
      ? Number(item.wholesaleMinQuantity)
      : undefined;

  const isWholesale = Boolean(
    wholesalePriceNum && wholesaleMinQtyNum && Number(qty) >= wholesaleMinQtyNum
  );

  if (isWholesale && wholesalePriceNum) {
    return Math.min(wholesalePriceNum, basePrice);
  }
  return basePrice;
};

/**
 * Retorna o preço total de um item do carrinho (preço unitário * quantidade).
 */
export const getItemTotalPrice = (item: CartItem, allCartItems?: CartItem[]): number => {
  const unitPrice = getItemUnitPrice(item, undefined, allCartItems);
  const qty = Number(item.quantity) || 1;
  return unitPrice * qty;
};
