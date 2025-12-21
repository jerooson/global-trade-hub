import { useState, useCallback, createContext, useContext } from "react";

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  createdAt?: Date;
}

interface ProductContextType {
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  products: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function useProductProvider() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([
    {
      id: "led",
      name: "LED",
      description: "Light Emitting Diodes and LED products",
      category: "Electronics",
    },
    {
      id: "semiconductors",
      name: "Semiconductors",
      description: "Semiconductor components and chips",
      category: "Electronics",
    },
    {
      id: "pcb",
      name: "PCB",
      description: "Printed Circuit Boards",
      category: "Electronics",
    },
  ]);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSelectedProduct((prev) => (prev?.id === id ? null : prev));
  }, []);

  return {
    selectedProduct,
    setSelectedProduct,
    products,
    addProduct,
    removeProduct,
  };
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
}

