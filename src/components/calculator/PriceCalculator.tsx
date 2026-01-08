import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calculator, 
  DollarSign, 
  Package, 
  Truck, 
  FileText, 
  BarChart3, 
  Save, 
  Building2, 
  Factory,
  TrendingUp,
  ArrowRight,
  Info,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ManufacturerResult } from "@/components/sourcing/ManufacturerPanel";
import { useCalculator, CostInput, CalculationResult } from "@/hooks/useCalculator";

// Re-export types for backward compatibility
export type { CostInput, CalculationResult };

interface PriceCalculatorProps {
  selectedManufacturer: ManufacturerResult | null;
}

function calculateUnitCost(input: CostInput): CalculationResult {
  // Step 1: Adjusted USD → RMB Rate
  // Excel formula: (C9-C10)*(1+C11)
  // Where: C9=USD Rate, C10=Agent Fee (0.035), C11=Tax Refund Rate (13% = 0.13)
  // Formula: (USD Rate - Agent Fee) × (1 + Tax Refund Rate)
  // Note: Agent Fee is entered directly as RMB amount (e.g., 0.035), not as percentage
  const adjustedUsdToRmbRate = (input.usdRate - input.agentFeeRate) * (1 + input.taxRefundRate / 100);

  // Step 2: Tax Refund (Cost Deduction) - Calculated for display only
  const taxRefundRmb = input.rmbUnitPrice * (input.taxRefundRate / 100);
  const netRmbCost = input.rmbUnitPrice - taxRefundRmb;

  // Step 3: Base USD Cost (Before Logistics)
  // Base USD Cost = RMB Unit Price / Adjusted USD→RMB Rate
  // Note: We use the full RMB unit price directly, not the net after tax refund
  const baseUsdCost = input.rmbUnitPrice / adjustedUsdToRmbRate;

  // Step 4: Total Freight Cost (RMB)
  const totalFreightRmb = input.freightBaseRmb + (input.cbm * input.freightPerCbmRmb);

  // Step 5: Freight Cost per Unit (USD)
  // Excel formula: (C17+C15)/C18/C3 = (FreightBase + CBM*FreightPerCBM) / FreightRate / Quantity
  const freightCostPerUnitUsd = (totalFreightRmb / input.quantity) / input.freightExchangeRate;

  // Step 6: Misc Cost per Unit (USD)
  // Misc RMB amount divided by quantity, then converted to USD using adjusted rate
  const miscCostPerUnitRmb = input.miscRmb / input.quantity;
  const miscCostPerUnitUsd = miscCostPerUnitRmb / adjustedUsdToRmbRate;

  // Step 7: Bank Fee per Unit
  // Excel formula: C22/C3 = BankFeeTotal / Quantity
  const bankFeePerUnitUsd = input.bankFeeTotalUsd / input.quantity;

  // Step 8: Final Unit Cost (USD) - Base + Misc (product costs only, no freight/bank)
  const finalUnitCostUsd = baseUsdCost + miscCostPerUnitUsd;
  
  // Suggested Selling Price: Apply profit to product costs (Base + Misc), then add pass-through costs (Freight + Bank)
  // Formula: (Base Cost + Misc) × (1 + Profit Rate) + Freight + Bank Fee
  const suggestedSellingPrice = finalUnitCostUsd * (1 + input.targetProfitRate / 100) + freightCostPerUnitUsd + bankFeePerUnitUsd;

  return {
    adjustedUsdToRmbRate,
    taxRefundRmb,
    netRmbCost,
    baseUsdCost,
    totalFreightRmb,
    freightCostPerUnitUsd,
    miscCostPerUnitUsd,
    bankFeePerUnitUsd,
    finalUnitCostUsd,
    suggestedSellingPrice,
  };
}

export function PriceCalculator({ selectedManufacturer }: PriceCalculatorProps) {
  // Use context for persistent state
  const {
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
  } = useCalculator();

  const handleChange = (field: keyof CostInput, value: string) => {
    if (value === "" || value === "-") {
      // Allow empty string - don't set to 0 immediately, let user type
      setFormData((prev) => ({ ...prev, [field]: 0 }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setFormData((prev) => ({ ...prev, [field]: numValue }));
      }
    }
  };

  const handleCalculate = (isReverseCalculate = false) => {
    setIsCalculating(true);

    // If this is the main calculate button (not reverse), uncheck reverse mode
    if (!isReverseCalculate) {
      setReverseMode(false);
      setTargetSellingPrice(0);
    }

    setTimeout(() => {
      try {
        let calculationResult = calculateUnitCost(formData);
        
        if (isReverseCalculate && targetSellingPrice > 0) {
          // Reverse calculation: Calculate required profit margin
          // Formula: Target Price = (Base + Misc) × (1 + Profit Rate) + Freight + Bank
          // Rearranging: Profit Rate = ((Target Price - Freight - Bank) / (Base + Misc)) - 1
          const productCost = calculationResult.finalUnitCostUsd; // Base + Misc
          const passThroughCosts = calculationResult.freightCostPerUnitUsd + calculationResult.bankFeePerUnitUsd;
          
          const availableForMarkup = targetSellingPrice - passThroughCosts;
          
          if (availableForMarkup > 0 && productCost > 0) {
            const requiredProfitRate = ((availableForMarkup / productCost) - 1) * 100;
            
            // Don't update the target profit rate in form data - keep them separate
            // Just recalculate with the current form data to show updated results
            calculationResult = calculateUnitCost(formData);
            setResult(calculationResult);
            
            // Toast removed - spinner in results panel indicates calculation
          } else {
            toast({
              title: "Invalid Target Price",
              description: "Target price must be higher than freight and bank costs.",
              variant: "destructive",
            });
          }
        } else {
          setResult(calculationResult);
          // Toast removed - spinner in results panel indicates calculation
        }
      } catch (error) {
        toast({
          title: "Calculation Error",
          description: "Please check your inputs and try again.",
          variant: "destructive",
        });
      } finally {
        setIsCalculating(false);
      }
    }, 500);
  };

  const handleSaveQuote = () => {
    toast({
      title: "Quote Saved",
      description: `Pricing scenario saved${selectedManufacturer ? ` for ${selectedManufacturer.name}` : ""}.`,
    });
  };

  return (
    <div className="flex-1 overflow-hidden p-3 flex flex-col">
      <div className="max-w-6xl mx-auto flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Pricing & Margin Calculator</h1>
              <p className="text-[10px] text-muted-foreground">
                Calculate landed cost from RMB factory price to final USD unit cost
              </p>
            </div>
          </div>
          {result && (
            <Button variant="outline" size="sm" onClick={handleSaveQuote} className="h-7 text-xs">
              <Save className="w-3 h-3 mr-1" />
              Save Quote
            </Button>
          )}
        </div>

        {/* Quote Context Panel */}
        {selectedManufacturer && (
          <Card className="bg-primary/5 border-primary/20 mb-2 flex-shrink-0">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                  {selectedManufacturer.type === "Factory" ? (
                    <Factory className="w-3 h-3 text-primary" />
                  ) : (
                    <Building2 className="w-3 h-3 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold">{selectedManufacturer.name}</h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        selectedManufacturer.type === "Factory"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      )}
                    >
                      {selectedManufacturer.type}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Confidence: {selectedManufacturer.confidence}% • {selectedManufacturer.products.slice(0, 2).join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3 flex-1 min-h-0">
          {/* Input Form */}
          <Card className="bg-card border-border flex flex-col min-h-0">
            <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="w-3.5 h-3.5" />
                Cost Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-3">
              {/* Product & Order Inputs */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 pb-0.5 border-b border-border">
                  <Package className="w-3 h-3 text-primary" />
                  <h3 className="font-semibold text-[11px]">Product & Order</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="rmbUnitPrice" className="text-[11px]">RMB Unit Price</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">¥</span>
                      <Input
                        id="rmbUnitPrice"
                        type="number"
                        placeholder="50.00"
                        value={formData.rmbUnitPrice || ""}
                        onChange={(e) => handleChange("rmbUnitPrice", e.target.value)}
                        className="pl-7 h-8 text-xs bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="quantity" className="text-[11px]">Quantity</Label>
                    <div className="relative">
                      <Package className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="1000"
                        value={formData.quantity || ""}
                        onChange={(e) => handleChange("quantity", e.target.value)}
                        className="pl-7 h-8 text-xs bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="miscRmb" className="text-[11px]">Misc (RMB)</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">¥</span>
                      <Input
                        id="miscRmb"
                        type="number"
                        placeholder="0"
                        value={formData.miscRmb || ""}
                        onChange={(e) => handleChange("miscRmb", e.target.value)}
                        className="pl-7 h-8 text-xs bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="cbm" className="text-[11px]">CBM</Label>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Info className="w-2.5 h-2.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-card border-border max-w-xs">
                          <p className="text-xs">
                            <strong>CBM (Cubic Meter)</strong> - Total shipment volume in cubic meters. 
                            Used to calculate freight costs. Calculate by: Length (m) × Width (m) × Height (m)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <Truck className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="cbm"
                        type="number"
                        placeholder="5.0"
                        value={formData.cbm || ""}
                        onChange={(e) => handleChange("cbm", e.target.value)}
                        className="pl-7 h-8 text-xs bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="targetProfitRate" className="text-[11px]">Target Profit (%)</Label>
                    <div className="relative">
                      <TrendingUp className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="targetProfitRate"
                        type="number"
                        step="0.01"
                        placeholder="30"
                        value={targetProfitRateInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Check if the value has more than 2 decimal places
                          const decimalIndex = val.indexOf('.');
                          if (decimalIndex !== -1) {
                            const decimalPart = val.substring(decimalIndex + 1);
                            if (decimalPart.length > 2) {
                              // Don't allow more than 2 decimal places
                              return;
                            }
                          }
                          setTargetProfitRateInput(val);
                          if (val === "") {
                            setFormData((prev) => ({ ...prev, targetProfitRate: 0 }));
                          } else {
                            const numValue = parseFloat(val);
                            if (!isNaN(numValue)) {
                              setFormData((prev) => ({ ...prev, targetProfitRate: numValue }));
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            setTargetProfitRateInput("0");
                            setFormData((prev) => ({ ...prev, targetProfitRate: 0 }));
                          } else {
                            const numValue = parseFloat(e.target.value);
                            if (!isNaN(numValue)) {
                              // Format: if it's a whole number, keep it whole; otherwise format to max 2 decimals
                              const formatted = numValue % 1 === 0 
                                ? numValue.toString() 
                                : parseFloat(numValue.toFixed(2)).toString();
                              setTargetProfitRateInput(formatted);
                            }
                          }
                        }}
                        className="pl-7 h-8 text-xs bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchange & Tax Inputs */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 pb-0.5 border-b border-border">
                  <DollarSign className="w-3 h-3 text-primary" />
                  <h3 className="font-semibold text-[11px]">Exchange & Tax</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="usdRate" className="text-[11px]">USD Rate</Label>
                    <Input
                      id="usdRate"
                      type="number"
                      step="0.01"
                      placeholder="7.20"
                      value={formData.usdRate || ""}
                      onChange={(e) => handleChange("usdRate", e.target.value)}
                      className="h-8 text-xs bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="agentFeeRate" className="text-[11px]">Agent Fee (RMB)</Label>
                    <Input
                      id="agentFeeRate"
                      type="number"
                      step="0.001"
                      placeholder="0.035"
                      value={agentFeeInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAgentFeeInput(val);
                        if (val === "") {
                          setFormData((prev) => ({ ...prev, agentFeeRate: 0 }));
                        } else {
                          const numValue = parseFloat(val);
                          if (!isNaN(numValue)) {
                            setFormData((prev) => ({ ...prev, agentFeeRate: numValue }));
                          }
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "") {
                          setAgentFeeInput("");
                        } else {
                          const numValue = parseFloat(e.target.value);
                          if (!isNaN(numValue)) {
                            setAgentFeeInput(numValue.toString());
                          }
                        }
                      }}
                      className="h-8 text-xs bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="taxRefundRate" className="text-[11px]">Tax Refund Rate (%)</Label>
                  <Input
                    id="taxRefundRate"
                    type="number"
                    step="0.1"
                    placeholder="13"
                    value={formData.taxRefundRate || ""}
                    onChange={(e) => handleChange("taxRefundRate", e.target.value)}
                    className="h-8 text-xs bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Freight & Bank Inputs */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 pb-0.5 border-b border-border">
                  <Truck className="w-3 h-3 text-primary" />
                  <h3 className="font-semibold text-[11px]">Freight & Bank</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="freightBaseRmb" className="text-[11px]">Freight Base (RMB)</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">¥</span>
                      <Input
                        id="freightBaseRmb"
                        type="number"
                        placeholder="500"
                        value={formData.freightBaseRmb || ""}
                        onChange={(e) => handleChange("freightBaseRmb", e.target.value)}
                        className="pl-6 h-8 text-xs bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="freightPerCbmRmb" className="text-[11px]">Freight per CBM (RMB)</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">¥</span>
                      <Input
                        id="freightPerCbmRmb"
                        type="number"
                        placeholder="800"
                        value={formData.freightPerCbmRmb || ""}
                        onChange={(e) => handleChange("freightPerCbmRmb", e.target.value)}
                        className="pl-6 h-8 text-xs bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="freightExchangeRate" className="text-[11px]">Freight Exchange Rate</Label>
                    <Input
                      id="freightExchangeRate"
                      type="number"
                      step="0.01"
                      placeholder="7.0"
                      value={formData.freightExchangeRate || ""}
                      onChange={(e) => handleChange("freightExchangeRate", e.target.value)}
                      className="h-8 text-xs bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="bankFeeTotalUsd" className="text-[11px]">Bank Fee and Labor Total (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        id="bankFeeTotalUsd"
                        type="number"
                        placeholder="150"
                        value={formData.bankFeeTotalUsd || ""}
                        onChange={(e) => handleChange("bankFeeTotalUsd", e.target.value)}
                        className="pl-7 h-8 text-xs bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className="flex-shrink-0 pt-3 border-t border-border mt-2">
                <Button onClick={() => handleCalculate(false)} className="w-full h-8 text-xs" size="default" disabled={isCalculating}>
                  {isCalculating ? (
                    <>Calculating...</>
                  ) : (
                    <>
                      <Calculator className="w-3.5 h-3.5 mr-1.5" />
                      Calculate Final Unit Cost
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card
            className={cn(
              "bg-card border-border transition-all duration-300 flex flex-col min-h-0 relative",
              result ? "opacity-100" : "opacity-50"
            )}
          >
            <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-3.5 h-3.5" />
                Calculation Results
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex-1 overflow-y-auto min-h-0 relative">
              {isCalculating && (
                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Calculating...</p>
                  </div>
                </div>
              )}
              {result ? (
                <div className="space-y-2.5 animate-fade-in">
                  {/* Step-by-Step Breakdown */}
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-[11px] flex items-center gap-1.5">
                      <Info className="w-3 h-3" />
                      Step-by-Step Calculation
                    </h3>
                    
                    <div className="space-y-1.5 text-[10px]">
                      <div className="p-1.5 rounded-lg bg-secondary/50 border border-border">
                        <div className="text-muted-foreground mb-0.5 text-[10px]">Step 1: Adjusted USD→RMB Rate</div>
                        <div className="text-[9px] text-muted-foreground mb-0.5">
                          ({formData.usdRate} - {formData.agentFeeRate}) × (1 + {formData.taxRefundRate}%) = {(formData.usdRate - formData.agentFeeRate).toFixed(4)} × {(1 + formData.taxRefundRate / 100).toFixed(4)}
                        </div>
                        <div className="font-semibold text-foreground text-xs">¥{result.adjustedUsdToRmbRate.toFixed(4)}</div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-secondary/50 border border-border">
                        <div className="text-muted-foreground mb-0.5 text-[10px]">Step 2: Base USD Cost</div>
                        <div className="text-[9px] text-muted-foreground mb-0.5">
                          {formData.rmbUnitPrice} ÷ {result.adjustedUsdToRmbRate.toFixed(4)}
                        </div>
                        <div className="font-semibold text-foreground text-xs">${result.baseUsdCost.toFixed(4)}</div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-secondary/50 border border-border">
                        <div className="text-muted-foreground mb-0.5 text-[10px]">Step 3: Total Freight (RMB)</div>
                        <div className="text-[9px] text-muted-foreground mb-0.5">
                          {formData.freightBaseRmb} + ({formData.cbm} × {formData.freightPerCbmRmb})
                        </div>
                        <div className="font-semibold text-foreground text-xs">¥{result.totalFreightRmb.toFixed(2)}</div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-secondary/50 border border-border">
                        <div className="text-muted-foreground mb-0.5 text-[10px]">Step 4: Freight per Unit (USD)</div>
                        <div className="text-[9px] text-muted-foreground mb-0.5">
                          ({result.totalFreightRmb.toFixed(2)} ÷ {formData.quantity}) ÷ {formData.freightExchangeRate}
                        </div>
                        <div className="font-semibold text-foreground text-xs">${result.freightCostPerUnitUsd.toFixed(4)}</div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-secondary/50 border border-border">
                        <div className="text-muted-foreground mb-0.5 text-[10px]">Step 5: Misc per Unit (USD)</div>
                        <div className="text-[9px] text-muted-foreground mb-0.5">
                          ({formData.miscRmb} ÷ {formData.quantity}) ÷ {result.adjustedUsdToRmbRate.toFixed(4)}
                        </div>
                        <div className="font-semibold text-foreground text-xs">${result.miscCostPerUnitUsd.toFixed(4)}</div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-secondary/50 border border-border">
                        <div className="text-muted-foreground mb-0.5 text-[10px]">Step 6: Bank Fee per Unit (USD)</div>
                        <div className="text-[9px] text-muted-foreground mb-0.5">
                          {formData.bankFeeTotalUsd} ÷ {formData.quantity}
                        </div>
                        <div className="font-semibold text-foreground text-xs">${result.bankFeePerUnitUsd.toFixed(4)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Final Results */}
                  <div className="pt-2 space-y-1.5 border-t border-border">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-secondary">
                      <div>
                        <div className="font-medium text-xs mb-0.5">Product Cost (Base + Misc)</div>
                        <div className="text-[9px] text-muted-foreground">
                          Base ${result.baseUsdCost.toFixed(4)} + Misc ${result.miscCostPerUnitUsd.toFixed(4)}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary">${result.finalUnitCostUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex-1">
                        <div className="font-medium text-primary text-xs mb-0.5">Suggested Selling Price</div>
                        <div className="text-[9px] text-muted-foreground">
                          ${result.finalUnitCostUsd.toFixed(2)} × {(1 + formData.targetProfitRate / 100).toFixed(2)} + Freight ${result.freightCostPerUnitUsd.toFixed(4)} + Bank ${result.bankFeePerUnitUsd.toFixed(4)}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary">${(Math.ceil(result.suggestedSellingPrice * 100) / 100).toFixed(2)}</span>
                    </div>
                    
                    {/* Reverse Calculation Section */}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          id="reverseMode"
                          checked={reverseMode}
                          onChange={(e) => setReverseMode(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-border"
                        />
                        <Label htmlFor="reverseMode" className="text-[10px] font-medium cursor-pointer">
                          Reverse Calculate: Enter target price to find required profit margin
                        </Label>
                      </div>
                      {reverseMode && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="targetSellingPrice" className="text-[10px] whitespace-nowrap">
                              Target Selling Price (USD):
                            </Label>
                            <Input
                              id="targetSellingPrice"
                              type="number"
                              step="0.01"
                              placeholder="2.10"
                              value={targetSellingPrice || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  setTargetSellingPrice(val);
                                } else if (e.target.value === "") {
                                  setTargetSellingPrice(0);
                                }
                              }}
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCalculate(true)}
                              disabled={isCalculating || targetSellingPrice <= 0}
                              className="h-7 text-xs px-2"
                            >
                              Calculate
                            </Button>
                          </div>
                          {reverseMode && targetSellingPrice > 0 && result && (() => {
                            const productCost = result.finalUnitCostUsd; // Base + Misc
                            const passThroughCosts = result.freightCostPerUnitUsd + result.bankFeePerUnitUsd;
                            const availableForMarkup = targetSellingPrice - passThroughCosts;
                            const requiredProfitRate = availableForMarkup > 0 && productCost > 0 
                              ? ((availableForMarkup / productCost) - 1) * 100 
                              : null;
                            
                            return (
                              <div className="p-2 rounded-lg bg-muted/50 border border-border">
                                <div className="text-[10px] text-muted-foreground mb-1">
                                  Required Profit Margin (for ${targetSellingPrice.toFixed(2)}):
                                </div>
                                <div className="text-sm font-bold text-primary">
                                  {requiredProfitRate !== null && requiredProfitRate > 0
                                    ? `${requiredProfitRate.toFixed(2)}%`
                                    : "Not feasible (below cost)"}
                                </div>
                                <div className="text-[9px] text-muted-foreground mt-1">
                                  Formula: ((${targetSellingPrice.toFixed(2)} - ${passThroughCosts.toFixed(4)}) ÷ ${productCost.toFixed(2)}) - 1
                                </div>
                                <div className="text-[9px] text-muted-foreground mt-1 italic">
                                  Note: This shows the profit margin needed for your target price. The Target Profit field above remains unchanged.
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={handleSaveQuote}>
                    <Save className="w-3 h-3 mr-1" />
                    Save Pricing Scenario
                  </Button>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-muted-foreground text-[10px] text-center">
                    Enter values and click Calculate to see your<br />cost breakdown and final unit cost
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
