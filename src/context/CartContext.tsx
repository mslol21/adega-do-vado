import { CartContext } from './useCart';
import React, { useState, useEffect } from 'react';
import type { Product, CartItem } from '../types';
import { getItemTotalPrice } from '../utils/price';
import { useStore } from './useStore';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id: storeId } = useStore();
  const storageKey = `pedido-zap-cart-${storeId}`;
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'string' && Number.isFinite(item.quantity) && item.quantity > 0) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); }
    catch (error) { console.warn('Não foi possível salvar o carrinho neste dispositivo.', error); }
  }, [cart, storageKey]);

  const addToCart = (product: Product, quantity: number = 1) => {
    const qtyToAdd = Math.max(1, quantity);
    setCart((prevCart) => {
      // Use name + id + selectedFlavor as a unique key for customized items
      const existingItem = prevCart.find((item) => item.id === product.id && item.name === product.name && item.selectedFlavor === product.selectedFlavor);
      if (existingItem) {
        return prevCart.map((item) =>
          (item.id === product.id && item.name === product.name && item.selectedFlavor === product.selectedFlavor) ? { ...item, quantity: item.quantity + qtyToAdd } : item
        );
      }
      return [...prevCart, { ...product, quantity: qtyToAdd }];
    });
  };

  const removeFromCart = (productId: string, productName?: string, selectedFlavor?: string) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && (!productName || item.name === productName) && (!selectedFlavor || item.selectedFlavor === selectedFlavor))));
  };

  const updateQuantity = (productId: string, quantity: number, productName?: string, selectedFlavor?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, productName, selectedFlavor);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        (item.id === productId && (!productName || item.name === productName) && (!selectedFlavor || item.selectedFlavor === selectedFlavor)) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + getItemTotalPrice(item, cart), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
