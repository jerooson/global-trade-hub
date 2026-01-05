import { cn } from "@/lib/utils";
import { LeftNavbar } from "@/components/layout/LeftNavbar";
import { TopHeader } from "@/components/layout/TopHeader";
import { GalleryPage } from "@/components/gallery/GalleryPage";
import { useNavbar } from "@/hooks/useNavbar";
import { Package2 } from "lucide-react";

const Gallery = () => {
  const { isCollapsed } = useNavbar();
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LeftNavbar />
      
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isCollapsed ? "ml-16" : "ml-56")}>
        <TopHeader 
          pageTitle="Product Gallery"
          pageIcon={<Package2 className="w-5 h-5 text-primary" />}
        />
        <div className="flex-1 overflow-auto">
          <GalleryPage />
        </div>
      </div>
    </div>
  );
};

export default Gallery;
