import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem, CartContextType } from '../types';
import { getItemTotalPrice } from '../utils/price';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('pedido-zap-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('pedido-zap-cart', JSON.stringify(cart));
  }, [cart]);

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

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
