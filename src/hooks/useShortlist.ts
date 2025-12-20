import { useState, useCallback, createContext, useContext } from "react";
import { ManufacturerResult } from "@/components/sourcing/ManufacturerPanel";

interface ShortlistContextType {
  shortlist: ManufacturerResult[];
  addToShortlist: (manufacturer: ManufacturerResult) => void;
  removeFromShortlist: (id: string) => void;
  isInShortlist: (id: string) => boolean;
  clearShortlist: () => void;
  selectedForPricing: ManufacturerResult | null;
  setSelectedForPricing: (manufacturer: ManufacturerResult | null) => void;
}

export const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

export function useShortlistProvider() {
  const [shortlist, setShortlist] = useState<ManufacturerResult[]>([]);
  const [selectedForPricing, setSelectedForPricing] = useState<ManufacturerResult | null>(null);

  const addToShortlist = useCallback((manufacturer: ManufacturerResult) => {
    setShortlist((prev) => {
      if (prev.find((m) => m.id === manufacturer.id)) return prev;
      return [...prev, manufacturer];
    });
  }, []);

  const removeFromShortlist = useCallback((id: string) => {
    setShortlist((prev) => prev.filter((m) => m.id !== id));
    setSelectedForPricing((prev) => (prev?.id === id ? null : prev));
  }, []);

  const isInShortlist = useCallback(
    (id: string) => shortlist.some((m) => m.id === id),
    [shortlist]
  );

  const clearShortlist = useCallback(() => {
    setShortlist([]);
    setSelectedForPricing(null);
  }, []);

  return {
    shortlist,
    addToShortlist,
    removeFromShortlist,
    isInShortlist,
    clearShortlist,
    selectedForPricing,
    setSelectedForPricing,
  };
}

export function useShortlist() {
  const context = useContext(ShortlistContext);
  if (!context) {
    throw new Error("useShortlist must be used within a ShortlistProvider");
  }
  return context;
}
