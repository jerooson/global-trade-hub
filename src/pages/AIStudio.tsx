import { LeftNavbar } from "@/components/layout/LeftNavbar";
import { TopHeader } from "@/components/layout/TopHeader";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateTab } from "@/components/aiStudio/GenerateTab";
import { ImageGallery } from "@/components/aiStudio/ImageGallery";
import { ImageGenerationProvider } from "@/hooks/useImageGeneration";
import { Sparkles } from "lucide-react";
import { useNavbar } from "@/hooks/useNavbar";
import { cn } from "@/lib/utils";

const AIStudio = () => {
  const { isCollapsed } = useNavbar();

  return (
    <ImageGenerationProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <LeftNavbar />
        
        <div className={cn("flex-1 flex flex-col transition-all duration-300", isCollapsed ? "ml-16" : "ml-56")}>
          <TopHeader 
            pageTitle="AI Studio"
            pageIcon={<Sparkles className="w-5 h-5 text-primary" />}
          />
          
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <Card>
                <CardContent className="p-6">
                  <GenerateTab />
                </CardContent>
              </Card>

              <ImageGallery />
            </div>
          </div>
        </div>
      </div>
    </ImageGenerationProvider>
  );
};

export default AIStudio;

