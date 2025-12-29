import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LeftSidebar, TabId } from "@/components/layout/RightSidebar";
import { SourcingPage } from "@/components/sourcing/SourcingPage";
import { PriceCalculator } from "@/components/calculator/PriceCalculator";
import { ShortlistContext, useShortlistProvider } from "@/hooks/useShortlist";
import { ProductContext, useProductProvider } from "@/hooks/useProduct";
import { CalculatorContext, useCalculatorProvider } from "@/hooks/useCalculator";
import { ChatContext, useChatProvider } from "@/hooks/useChat";
import { ManufacturerResult } from "@/components/sourcing/ManufacturerPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Clock, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Workspace = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("sourcing");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const shortlistState = useShortlistProvider();
  const productState = useProductProvider();
  const calculatorState = useCalculatorProvider();
  const chatState = useChatProvider();
  const [selectedManufacturer, setSelectedManufacturer] = useState<ManufacturerResult | null>(null);

  // Set product from URL parameter if available
  useEffect(() => {
    if (productId && productState.products.length > 0) {
      const product = productState.products.find((p) => p.id === productId);
      if (product && productState.selectedProduct?.id !== product.id) {
        productState.setSelectedProduct(product);
      }
    }
  }, [productId, productState.products, productState.selectedProduct, productState.setSelectedProduct]);

  // Redirect to gallery if no product is selected after products are loaded
  useEffect(() => {
    if (productState.products.length > 0 && !productState.selectedProduct && !productId) {
      navigate("/");
    }
  }, [productState.selectedProduct, productState.products, navigate, productId]);

  const handleNavigateToPricing = () => {
    if (shortlistState.selectedForPricing) {
      setSelectedManufacturer(shortlistState.selectedForPricing);
    }
    setActiveTab("calculator");
  };

  const handleSelectForPricing = (manufacturer: ManufacturerResult) => {
    setSelectedManufacturer(manufacturer);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "sourcing":
        return (
          <SourcingPage 
            onNavigateToPricing={handleNavigateToPricing}
            onSelectForPricing={handleSelectForPricing}
          />
        );
      case "calculator":
        return <PriceCalculator selectedManufacturer={selectedManufacturer} />;
      case "approvals":
        return (
          <div className="h-full flex items-center justify-center p-8">
            <Card className="max-w-md bg-card border-border">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Approvals Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Review and approve outreach requests, pricing decisions, and supplier selections 
                  before they're actioned.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Expected in v2.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  if (!productState.selectedProduct) {
    return null; // Will redirect via useEffect
  }

  return (
    <ShortlistContext.Provider value={shortlistState}>
      <CalculatorContext.Provider value={calculatorState}>
        <ChatContext.Provider value={chatState}>
          <div className="h-screen bg-background flex overflow-hidden">
        <LeftSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onCollapseChange={setIsSidebarCollapsed}
        />

        <main className={cn(
          "flex-1 transition-all duration-300 flex flex-col",
          isSidebarCollapsed ? "ml-16" : "ml-56"
        )}>
          {/* Product Context Banner - Fixed at top */}
          {productState.selectedProduct && (
            <div className="h-12 px-6 flex items-center justify-between border-b border-border bg-primary/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Working with: <span className="text-primary">{productState.selectedProduct.name}</span>
                </span>
                <Badge variant="secondary" className="text-xs">
                  {productState.selectedProduct.category || "Uncategorized"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="text-xs"
                >
                  Change Product
                </Button>
                <ThemeToggle />
              </div>
            </div>
          )}
          {/* Content area - takes remaining height */}
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        </main>
      </div>
        </ChatContext.Provider>
      </CalculatorContext.Provider>
    </ShortlistContext.Provider>
  );
};

export default Workspace;

