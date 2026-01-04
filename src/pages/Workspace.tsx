import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LeftNavbar } from "@/components/layout/LeftNavbar";
import { TopHeader } from "@/components/layout/TopHeader";
import { HorizontalTabs, TabId } from "@/components/layout/HorizontalTabs";
import { SourcingPage } from "@/components/sourcing/SourcingPage";
import { PriceCalculator } from "@/components/calculator/PriceCalculator";
import { ShortlistContext, useShortlistProvider } from "@/hooks/useShortlist";
import { ProductContext, useProductProvider } from "@/hooks/useProduct";
import { CalculatorContext, useCalculatorProvider } from "@/hooks/useCalculator";
import { ChatContext, useChatProvider } from "@/hooks/useChat";
import { ManufacturerResult } from "@/components/sourcing/ManufacturerPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

const Workspace = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("sourcing");
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

  if (!productState.selectedProduct) {
    return null; // Will redirect via useEffect
  }

  return (
    <ShortlistContext.Provider value={shortlistState}>
      <CalculatorContext.Provider value={calculatorState}>
        <ChatContext.Provider value={chatState}>
          <div className="flex h-screen bg-background overflow-hidden">
            <LeftNavbar />
            
            <div className="flex-1 flex flex-col ml-56">
              <TopHeader product={productState.selectedProduct} />
              
              {/* Horizontal Tabs */}
              <HorizontalTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Main Content Area */}
              <main className="flex-1 overflow-hidden flex flex-col">
                {activeTab === "sourcing" ? (
                  <SourcingPage onNavigateToPricing={handleNavigateToPricing} />
                ) : activeTab === "calculator" ? (
                  <PriceCalculator manufacturer={selectedManufacturer} />
                ) : (
                  <div className="flex-1 overflow-auto flex items-center justify-center py-20">
                    <div className="container">
                      <Card className="max-w-md">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5" />
                            Approvals Coming Soon
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">
                            The approvals workflow is under development and will be available soon.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </ChatContext.Provider>
      </CalculatorContext.Provider>
    </ShortlistContext.Provider>
  );
};

export default Workspace;
