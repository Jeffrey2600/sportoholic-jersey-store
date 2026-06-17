import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
  sku?: string;
  size?: string;
  fullSleeve: boolean;
  extraCharges: number;
  customizedName?: string;
  quantity: number;
  stockQuantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "sportoholic_cart_v1";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.productId === item.productId &&
          p.size === item.size &&
          p.fullSleeve === item.fullSleeve &&
          (p.customizedName || "") === (item.customizedName || "")
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: Math.min(copy[idx].quantity + item.quantity, item.stockQuantity),
        };
        return copy;
      }
      return [...prev, item];
    });
    toast.success("Added to cart");
  };

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateQuantity = (index: number, qty: number) =>
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? { ...it, quantity: Math.max(1, Math.min(qty, it.stockQuantity)) }
          : it
      )
    );

  const clear = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce(
    (s, i) => s + (i.price + i.extraCharges) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};
