import { LeftNavbar } from "@/components/layout/LeftNavbar";
import { TopHeader } from "@/components/layout/TopHeader";
import { GalleryPage } from "@/components/gallery/GalleryPage";
import { Package2 } from "lucide-react";

const Gallery = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LeftNavbar />
      
      <div className="flex-1 flex flex-col ml-56">
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
