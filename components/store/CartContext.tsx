"use client";


import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";


export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};


type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
};


const CartContext = createContext<CartContextType | undefined>(undefined);


const CART_STORAGE_KEY = "ascohomes-cart";


export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);


  // =========================================================
  // LOAD CART FROM LOCAL STORAGE
  // =========================================================


  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);


      if (!savedCart) {
        setCartLoaded(true);
        return;
      }


      const parsedCart: unknown = JSON.parse(savedCart);


      if (!Array.isArray(parsedCart)) {
        localStorage.removeItem(CART_STORAGE_KEY);
        setCartLoaded(true);
        return;
      }


      const validItems = parsedCart.filter((item): item is CartItem => {
        if (!item || typeof item !== "object") {
          return false;
        }


        const cartItem = item as Partial<CartItem>;


        return (
          typeof cartItem.id === "string" &&
          cartItem.id.trim().length > 0 &&
          typeof cartItem.name === "string" &&
          cartItem.name.trim().length > 0 &&
          typeof cartItem.price === "number" &&
          Number.isFinite(cartItem.price) &&
          typeof cartItem.quantity === "number" &&
          Number.isFinite(cartItem.quantity) &&
          cartItem.quantity > 0
        );
      });


      // =====================================================
      // NORMALIZE CART
      // =====================================================
      //
      // If duplicate products somehow exist in localStorage,
      // combine them into one item using the product ID.
      //
      const normalizedCart: CartItem[] = [];


      for (const item of validItems) {
        const existingItem = normalizedCart.find(
          (cartItem) => cartItem.id === item.id
        );


        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          normalizedCart.push({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
            image: item.image,
          });
        }
      }


      setCart(normalizedCart);
    } catch (error) {
      console.error("Could not load cart:", error);


      localStorage.removeItem(CART_STORAGE_KEY);
      setCart([]);
    } finally {
      setCartLoaded(true);
    }
  }, []);


  // =========================================================
  // SAVE CART TO LOCAL STORAGE
  // =========================================================


  useEffect(() => {
    if (!cartLoaded) {
      return;
    }


    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [cart, cartLoaded]);


  // =========================================================
  // ADD PRODUCT TO CART
  // =========================================================


  const addToCart = (
    item: Omit<CartItem, "quantity">
  ) => {
    if (!item.id || item.id.trim() === "") {
      console.error(
        "Cannot add product: missing product ID.",
        item
      );
      return;
    }


    setCart((currentCart) => {
      const existingItemIndex = currentCart.findIndex(
        (cartItem) => cartItem.id === item.id
      );


      // =====================================================
      // PRODUCT ALREADY EXISTS
      // =====================================================


      if (existingItemIndex !== -1) {
        return currentCart.map((cartItem, index) => {
          if (index !== existingItemIndex) {
            return cartItem;
          }


          return {
            ...cartItem,
            quantity: cartItem.quantity + 1,
          };
        });
      }


      // =====================================================
      // NEW PRODUCT
      // =====================================================


      const newItem: CartItem = {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: 1,
        image: item.image,
      };


      return [...currentCart, newItem];
    });
  };


  // =========================================================
  // REMOVE PRODUCT
  // =========================================================


  const removeFromCart = (id: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };


  // =========================================================
  // INCREASE QUANTITY
  // =========================================================


  const increaseQuantity = (id: string) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }


        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  };


  // =========================================================
  // DECREASE QUANTITY
  // =========================================================


  const decreaseQuantity = (id: string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== id) {
            return item;
          }


          return {
            ...item,
            quantity: item.quantity - 1,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };


  // =========================================================
  // CLEAR CART
  // =========================================================


  const clearCart = () => {
    setCart([]);
  };


  // =========================================================
  // PROVIDER
  // =========================================================


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


// ===========================================================
// USE CART HOOK
// ===========================================================


export function useCart() {
  const context = useContext(CartContext);


  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }


  return context;
}


