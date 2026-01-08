import { createContext, useContext, useState, ReactNode } from "react";

export interface GeneratedImage {
  id: string;
  imageBase64: string;
  prompt: string;
  aspectRatio: string;
  timestamp: Date;
}

interface ImageGenerationContextType {
  generatedImages: GeneratedImage[];
  addImage: (image: GeneratedImage) => void;
  clearImages: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

const ImageGenerationContext = createContext<ImageGenerationContextType | undefined>(undefined);

export function ImageGenerationProvider({ children }: { children: ReactNode }) {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addImage = (image: GeneratedImage) => {
    setGeneratedImages((prev) => [image, ...prev]);
  };

  const clearImages = () => {
    setGeneratedImages([]);
  };

  return (
    <ImageGenerationContext.Provider
      value={{
        generatedImages,
        addImage,
        clearImages,
        isGenerating,
        setIsGenerating,
      }}
    >
      {children}
    </ImageGenerationContext.Provider>
  );
}

export function useImageGeneration() {
  const context = useContext(ImageGenerationContext);
  if (!context) {
    throw new Error("useImageGeneration must be used within ImageGenerationProvider");
  }
  return context;
}

