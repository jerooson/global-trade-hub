import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { generateImage, editImage } from "@/services/imageApi";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { toast } from "@/hooks/use-toast";

export function GenerateTab() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { addImage, isGenerating, setIsGenerating } = useImageGeneration();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(",")[1]; // Remove data:image/png;base64, prefix
      setUploadedImage(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      let result;
      if (uploadedImage) {
        // Edit existing image
        result = await editImage({ prompt, imageBase64: uploadedImage, aspectRatio });
      } else {
        // Generate new image
        result = await generateImage({ prompt, aspectRatio });
      }
      
      addImage({
        id: Date.now().toString(),
        imageBase64: result.image,
        prompt: result.prompt,
        aspectRatio: result.aspectRatio,
        timestamp: new Date(),
      });
      toast({ title: uploadedImage ? "Image edited successfully!" : "Image generated successfully!" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
      toast({ title: errorMessage, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Optional Image Upload */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          Upload Image (optional - for editing existing images)
        </Label>
        <div className="flex gap-2">
          <Input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload}
            disabled={!!uploadedImage}
            className="flex-1"
          />
          {uploadedImage && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={clearUploadedImage}
              type="button"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {uploadedImage && (
          <img
            src={`data:image/png;base64,${uploadedImage}`}
            alt="Uploaded"
            className="max-w-xs rounded-lg border"
          />
        )}
      </div>

      {/* Prompt */}
      <Textarea
        placeholder={uploadedImage 
          ? "Describe how you want to modify the image..."
          : "Describe the image you want to generate..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
      />

      {/* Controls */}
      <div className="flex gap-3">
        <Select value={aspectRatio} onValueChange={setAspectRatio}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">Square (1:1)</SelectItem>
            <SelectItem value="16:9">Landscape (16:9)</SelectItem>
            <SelectItem value="9:16">Portrait (9:16)</SelectItem>
            <SelectItem value="3:2">3:2</SelectItem>
            <SelectItem value="2:3">2:3</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadedImage ? "Editing..." : "Generating..."}
            </>
          ) : (
            <>
              {uploadedImage ? (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Edit Image
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

