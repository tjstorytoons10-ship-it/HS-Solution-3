import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, ProductVariant } from '../types';
import { api } from '../lib/api';

interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedAttributes?: Record<string, string>, selectedVariant?: ProductVariant) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<string>;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  totalItemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  freeDeliveryThreshold: number;
  remainingForFreeDelivery: number;
}

const CART_STORAGE_KEY = 'buraqmart_cart_v1';
const COUPON_STORAGE_KEY = 'buraqmart_coupon_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon]);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Free delivery threshold in Pakistan standard
  const freeDeliveryThreshold = 2999;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  // Recalculate coupon discount if items change
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedAttributes: Record<string, string> = {},
    selectedVariant?: ProductVariant
  ) => {
    setItems(prev => {
      // Calculate adjusted unit price
      const priceAdjustment = selectedVariant?.priceAdjustment || 0;
      const unitPrice = product.salePrice + priceAdjustment;

      // Check if identical item + attributes already in cart
      const existingIndex = prev.findIndex(item => {
        if (item.productId !== product.id) return false;
        const currentAttrs = JSON.stringify(item.selectedAttributes || {});
        const newAttrs = JSON.stringify(selectedAttributes || {});
        return currentAttrs === newAttrs;
      });

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            product,
            quantity,
            selectedAttributes,
            selectedVariant,
            unitPrice
          }
        ];
      }
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setItems(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], quantity };
      }
      return next;
    });
  };

  const removeFromCart = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<string> => {
    if (!code.trim()) throw new Error('Please enter a coupon code.');
    if (subtotal === 0) throw new Error('Cart is empty.');

    const res = await api.validateCoupon(code.trim(), subtotal);
    if (!res.valid) throw new Error('Invalid coupon.');

    setAppliedCoupon({
      code: res.code,
      type: res.type,
      discountValue: res.discountValue,
      discountAmount: res.discountAmount
    });

    return `Coupon ${res.code} applied! Saved Rs. ${res.discountAmount.toLocaleString()}`;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        totalItemCount,
        isCartOpen,
        setIsCartOpen,
        freeDeliveryThreshold,
        remainingForFreeDelivery
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
