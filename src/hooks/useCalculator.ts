import { useState, useCallback, createContext, useContext, useEffect } from "react";

export interface CalculationResult {
  adjustedUsdToRmbRate: number;
  taxRefundRmb: number;
  netRmbCost: number;
  baseUsdCost: number;
  totalFreightRmb: number;
  freightCostPerUnitUsd: number;
  miscCostPerUnitUsd: number;
  bankFeePerUnitUsd: number;
  finalUnitCostUsd: number;
  suggestedSellingPrice: number;
}

export interface CostInput {
  // Product & Order
  quantity: number;
  cbm: number;
  rmbUnitPrice: number;
  miscRmb: number;
  targetProfitRate: number;
  // Exchange & Tax
  usdRate: number;
  agentFeeRate: number;
  taxRefundRate: number;
  // Freight & Bank
  freightBaseRmb: number;
  freightPerCbmRmb: number;
  freightExchangeRate: number;
  bankFeeTotalUsd: number;
}

interface CalculatorContextType {
  formData: CostInput;
  setFormData: (data: CostInput | ((prev: CostInput) => CostInput)) => void;
  updateFormField: <K extends keyof CostInput>(field: K, value: CostInput[K]) => void;
  result: CalculationResult | null;
  setResult: (result: CalculationResult | null) => void;
  isCalculating: boolean;
  setIsCalculating: (calculating: boolean) => void;
  agentFeeInput: string;
  setAgentFeeInput: (value: string) => void;
  targetProfitRateInput: string;
  setTargetProfitRateInput: (value: string) => void;
  reverseMode: boolean;
  setReverseMode: (mode: boolean) => void;
  targetSellingPrice: number;
  setTargetSellingPrice: (price: number) => void;
  resetCalculator: () => void;
}

export const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

const STORAGE_KEY = "price-calculator-state";
const DEFAULT_FORM_DATA: CostInput = {
  // Product & Order
  quantity: 1000,
  cbm: 5,
  rmbUnitPrice: 50,
  miscRmb: 0,
  targetProfitRate: 30,
  // Exchange & Tax
  usdRate: 7.2,
  agentFeeRate: 0.035,
  taxRefundRate: 13,
  // Freight & Bank
  freightBaseRmb: 500,
  freightPerCbmRmb: 800,
  freightExchangeRate: 7.0,
  bankFeeTotalUsd: 150,
};

function loadFromStorage(): Partial<CalculatorContextType> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to load calculator state from localStorage:", error);
  }
  return null;
}

function saveToStorage(state: Partial<CalculatorContextType>) {
  try {
    // Only save form data and input strings, not calculation results or UI state
    const toSave = {
      formData: state.formData,
      agentFeeInput: state.agentFeeInput,
      targetProfitRateInput: state.targetProfitRateInput,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.warn("Failed to save calculator state to localStorage:", error);
  }
}

export function useCalculatorProvider() {
  // Load initial state from localStorage
  const stored = loadFromStorage();
  
  const [formData, setFormDataState] = useState<CostInput>(
    stored?.formData || DEFAULT_FORM_DATA
  );
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [agentFeeInput, setAgentFeeInput] = useState<string>(
    stored?.agentFeeInput || "0.035"
  );
  const [targetProfitRateInput, setTargetProfitRateInput] = useState<string>(
    stored?.targetProfitRateInput || "30"
  );
  const [reverseMode, setReverseMode] = useState(false);
  const [targetSellingPrice, setTargetSellingPrice] = useState<number>(0);

  // Save to localStorage whenever form data or input strings change
  useEffect(() => {
    saveToStorage({
      formData,
      agentFeeInput,
      targetProfitRateInput,
    });
  }, [formData, agentFeeInput, targetProfitRateInput]);

  // Wrapper for setFormData that also handles function updates
  const setFormData = useCallback((data: CostInput | ((prev: CostInput) => CostInput)) => {
    setFormDataState(data);
  }, []);

  // Helper to update a single field
  const updateFormField = useCallback(<K extends keyof CostInput>(
    field: K,
    value: CostInput[K]
  ) => {
    setFormDataState((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Reset to defaults
  const resetCalculator = useCallback(() => {
    setFormDataState(DEFAULT_FORM_DATA);
    setResult(null);
    setIsCalculating(false);
    setAgentFeeInput("0.035");
    setTargetProfitRateInput("30");
    setReverseMode(false);
    setTargetSellingPrice(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    formData,
    setFormData,
    updateFormField,
    result,
    setResult,
    isCalculating,
    setIsCalculating,
    agentFeeInput,
    setAgentFeeInput,
    targetProfitRateInput,
    setTargetProfitRateInput,
    reverseMode,
    setReverseMode,
    targetSellingPrice,
    setTargetSellingPrice,
    resetCalculator,
  };
}

export function useCalculator() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error("useCalculator must be used within a CalculatorProvider");
  }
  return context;
}

