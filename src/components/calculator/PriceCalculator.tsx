import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, DollarSign, Package, Truck, FileText, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function PriceCalculator() {
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

  const handleCalculate = () => {
    setIsCalculating(true);

    setTimeout(() => {
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const quantity = parseInt(formData.quantity) || 1;
      const weight = parseFloat(formData.weight) || 0;
      const customsRate = parseFloat(formData.customsRate) || 0;
      const margin = parseFloat(formData.margin) || 0;

      const productCost = unitPrice * quantity;
      const shippingCost =
        formData.shippingMethod === "air" ? weight * 8.5 : weight * 2.2;
      const customsDuty = productCost * (customsRate / 100);
      const insurance = productCost * 0.01;
      const handlingFees = 150;
      const total =
        productCost + shippingCost + customsDuty + insurance + handlingFees;
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

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Price Calculator</h1>
            <p className="text-muted-foreground">
              Calculate landed cost and pricing for your imports
            </p>
          </div>
        </div>

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

              <Button
                onClick={handleCalculate}
                className="w-full"
                size="lg"
                disabled={isCalculating}
              >
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
                <div className="space-y-4 animate-fade-in">
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
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="font-medium">
                          ${item.value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
                      <span className="font-medium">Total Landed Cost</span>
                      <span className="text-xl font-bold text-primary">
                        ${result.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
                      <span className="font-medium">Cost per Unit</span>
                      <span className="text-lg font-semibold">
                        ${result.unitCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <span className="font-medium text-primary">
                        Suggested Selling Price
                      </span>
                      <span className="text-xl font-bold text-primary">
                        ${result.marginPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Enter values and click Calculate to see results
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
