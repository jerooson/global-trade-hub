import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImageGeneration } from "@/hooks/useImageGeneration";

export function ImageGallery() {
  const { generatedImages, clearImages } = useImageGeneration();

  const downloadImage = (image: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${image}`;
    link.download = `ai-studio-${Date.now()}.png`;
    link.click();
  };

  if (generatedImages.length === 0) {
    return null; // Don't show anything when empty
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Generated Images ({generatedImages.length})</h3>
          <Button variant="outline" size="sm" onClick={clearImages}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {generatedImages.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={`data:image/png;base64,${img.imageBase64}`}
                alt={img.prompt}
                className="w-full rounded-lg border"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  size="sm"
                  onClick={() => downloadImage(img.imageBase64, img.prompt)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{img.prompt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

