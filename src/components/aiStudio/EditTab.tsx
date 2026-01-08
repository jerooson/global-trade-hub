import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2 } from "lucide-react";
import { editImage } from "@/services/imageApi";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { toast } from "@/hooks/use-toast";

export function EditTab() {
  const [prompt, setPrompt] = useState("");
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

  const handleEdit = async () => {
    if (!prompt.trim() || !uploadedImage) return;

    setIsGenerating(true);
    try {
      const result = await editImage({ prompt, imageBase64: uploadedImage });
      addImage({
        id: Date.now().toString(),
        imageBase64: result.image,
        prompt: result.prompt,
        aspectRatio: result.aspectRatio,
        timestamp: new Date(),
      });
      toast({ title: "Image edited successfully!" });
    } catch (error) {
      toast({ title: "Failed to edit image", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Upload Image</Label>
        <Input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploadedImage && (
          <img
            src={`data:image/png;base64,${uploadedImage}`}
            alt="Uploaded"
            className="max-w-xs rounded-lg border"
          />
        )}
      </div>
      <Textarea
        placeholder="Describe how you want to modify the image..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
      />
      <Button onClick={handleEdit} disabled={isGenerating || !prompt.trim() || !uploadedImage}>
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Editing...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Edit Image
          </>
        )}
      </Button>
    </div>
  );
}

