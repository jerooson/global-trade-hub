import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ManufacturerResult } from "@/components/sourcing/ManufacturerPanel";

interface CostBreakdown {
  productCost: number;
  shippingCost: number;
  customsDuty: number;
  insurance: number;
  handlingFees: number;
  total: number;
  unitCost: number;
  marginPrice: number;
}

interface PriceCalculatorProps {
  selectedManufacturer: ManufacturerResult | null;
}

const marginPresets = [
  { label: "Conservative", value: 15, description: "Lower risk, competitive pricing" },
  { label: "Standard", value: 30, description: "Balanced profit margin" },
  { label: "Aggressive", value: 50, description: "Higher margin, premium positioning" },
];

export function PriceCalculator({ selectedManufacturer }: PriceCalculatorProps) {
  const [formData, setFormData] = useState({
    unitPrice: "",
    quantity: "",
    weight: "",
    shippingMethod: "sea",
    customsRate: "5",
    margin: "30",
  });
  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMarginPreset = (value: number) => {
    setFormData((prev) => ({ ...prev, margin: value.toString() }));
  };

  const handleCalculate = () => {
    setIsCalculating(true);

    setTimeout(() => {
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const quantity = parseInt(formData.quantity) || 1;
      const weight = parseFloat(formData.weight) || 0;
      const customsRate = parseFloat(formData.customsRate) || 0;
      const margin = parseFloat(formData.margin) || 0;

      const productCost = unitPrice * quantity;
      const shippingCost = formData.shippingMethod === "air" ? weight * 8.5 : weight * 2.2;
      const customsDuty = productCost * (customsRate / 100);
      const insurance = productCost * 0.01;
      const handlingFees = 150;
      const total = productCost + shippingCost + customsDuty + insurance + handlingFees;
      const unitCost = total / quantity;
      const marginPrice = unitCost * (1 + margin / 100);

      setResult({
        productCost,
        shippingCost,
        customsDuty,
        insurance,
        handlingFees,
        total,
        unitCost,
        marginPrice,
      });
      setIsCalculating(false);
    }, 800);
  };

  const handleSaveQuote = () => {
    toast({
      title: "Quote Saved",
      description: `Pricing scenario saved${selectedManufacturer ? ` for ${selectedManufacturer.name}` : ""}.`,
    });
  };

  const costBreakdownData = result
    ? [
        { label: "Product Cost", value: result.productCost, color: "bg-primary" },
        { label: "Shipping", value: result.shippingCost, color: "bg-info" },
        { label: "Customs Duty", value: result.customsDuty, color: "bg-warning" },
        { label: "Insurance", value: result.insurance, color: "bg-success" },
        { label: "Handling", value: result.handlingFees, color: "bg-muted-foreground" },
      ]
    : [];

  const totalCost = costBreakdownData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pricing & Margin Calculator</h1>
              <p className="text-muted-foreground">
                Calculate landed cost and optimize your pricing strategy
              </p>
            </div>
          </div>
          {result && (
            <Button variant="outline" onClick={handleSaveQuote}>
              <Save className="w-4 h-4 mr-2" />
              Save as Quote
            </Button>
          )}
        </div>

        {/* Quote Context Panel */}
        {selectedManufacturer && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  {selectedManufacturer.type === "Factory" ? (
                    <Factory className="w-5 h-5 text-primary" />
                  ) : (
                    <Building2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{selectedManufacturer.name}</h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        selectedManufacturer.type === "Factory"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      )}
                    >
                      {selectedManufacturer.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {selectedManufacturer.confidence}% • {selectedManufacturer.products.slice(0, 2).join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Cost Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (USD)</Label>
                  <p className="text-xs text-muted-foreground">Supplier quote per unit</p>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="unitPrice"
                      type="number"
                      placeholder="0.00"
                      value={formData.unitPrice}
                      onChange={(e) => handleChange("unitPrice", e.target.value)}
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <p className="text-xs text-muted-foreground">Total order quantity</p>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="1000"
                      value={formData.quantity}
                      onChange={(e) => handleChange("quantity", e.target.value)}
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Total Weight (kg)</Label>
                <p className="text-xs text-muted-foreground">Shipment weight estimate</p>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="weight"
                    type="number"
                    placeholder="500"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shipping Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["sea", "air"].map((method) => (
                    <button
                      key={method}
                      onClick={() => handleChange("shippingMethod", method)}
                      className={cn(
                        "p-3 rounded-lg border text-sm font-medium transition-all",
                        formData.shippingMethod === method
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary hover:bg-secondary/80"
                      )}
                    >
                      {method === "sea" ? "🚢 Sea Freight" : "✈️ Air Freight"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customsRate">Customs Duty (%)</Label>
                  <p className="text-xs text-muted-foreground">Import duty rate</p>
                  <Input
                    id="customsRate"
                    type="number"
                    placeholder="5"
                    value={formData.customsRate}
                    onChange={(e) => handleChange("customsRate", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin">Target Margin (%)</Label>
                  <p className="text-xs text-muted-foreground">Your expected profit</p>
                  <Input
                    id="margin"
                    type="number"
                    placeholder="30"
                    value={formData.margin}
                    onChange={(e) => handleChange("margin", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Margin Sensitivity */}
              <div className="space-y-3 pt-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Quick Margin Presets
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {marginPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleMarginPreset(preset.value)}
                      className={cn(
                        "p-2 rounded-lg border text-xs transition-all",
                        parseFloat(formData.margin) === preset.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary hover:bg-secondary/80"
                      )}
                    >
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-muted-foreground">{preset.value}%</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleCalculate} className="w-full" size="lg" disabled={isCalculating}>
                {isCalculating ? (
                  <>Calculating...</>
                ) : (
                  <>
                    <Calculator className="w-5 h-5 mr-2" />
                    Calculate
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card
            className={cn(
              "bg-card border-border transition-all duration-300",
              result ? "opacity-100" : "opacity-50"
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Visual Cost Breakdown */}
                  <div className="space-y-3">
                    <div className="h-8 rounded-lg overflow-hidden flex">
                      {costBreakdownData.map((item) => {
                        const percentage = (item.value / totalCost) * 100;
                        if (percentage < 1) return null;
                        return (
                          <div
                            key={item.label}
                            className={cn("h-full transition-all", item.color)}
                            style={{ width: `${percentage}%` }}
                            title={`${item.label}: $${item.value.toFixed(2)} (${percentage.toFixed(1)}%)`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {costBreakdownData.map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-xs">
                          <div className={cn("w-3 h-3 rounded", item.color)} />
                          <span className="text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-3">
                    {[
                      { label: "Product Cost", value: result.productCost },
                      { label: "Shipping Cost", value: result.shippingCost },
                      { label: "Customs Duty", value: result.customsDuty },
                      { label: "Insurance (1%)", value: result.insurance },
                      { label: "Handling Fees", value: result.handlingFees },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-2 border-b border-border/50"
                      >
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="font-medium">${item.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
                      <span className="font-medium">Total Landed Cost</span>
                      <span className="text-xl font-bold text-primary">${result.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
                      <span className="font-medium">Cost per Unit</span>
                      <span className="text-lg font-semibold">${result.unitCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <span className="font-medium text-primary">Suggested Selling Price</span>
                      <span className="text-xl font-bold text-primary">${result.marginPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={handleSaveQuote}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Pricing Scenario
                  </Button>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm text-center">
                    Enter values and click Calculate to see your<br />cost breakdown and pricing recommendations
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
