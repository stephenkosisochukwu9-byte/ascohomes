"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type CartItem = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (name: string) => void;
  increaseQuantity: (name: string) => void;
  decreaseQuantity: (name: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ascohomes-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error("Could not load cart:", error);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!cartLoaded) {
      return;
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [cart, cartLoaded]);

  // Add product to cart
  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) =>
          cartItem.id === item.id ||
          cartItem.name === item.name
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === existingItem.id ||
          cartItem.name === existingItem.name
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  // Remove product from cart
  const removeFromCart = (name: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.name !== name)
    );
  };

  // Increase quantity
  const increaseQuantity = (name: string) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.name === name
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // Decrease quantity
  const decreaseQuantity = (name: string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.name === name
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
