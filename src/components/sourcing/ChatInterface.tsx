import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ImagePlus, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ManufacturerResult {
  name: string;
  type: "Factory" | "Trading Company";
  confidence: number;
  address: string;
  contact: string;
  email: string;
  phone: string;
  products: string[];
}

interface ChatInterfaceProps {
  onResult: (result: ManufacturerResult | null) => void;
}

export function ChatInterface({ onResult }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome to TradeHub Sourcing! Upload a product image or describe what you're looking for, and I'll help you identify potential manufacturers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !uploadedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || "Analyzing uploaded image...",
      image: uploadedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setUploadedImage(null);
    setIsLoading(true);

    // Simulate API response
    setTimeout(() => {
      const mockResult: ManufacturerResult = {
        name: "Shenzhen Precision Electronics Co., Ltd",
        type: "Factory",
        confidence: 87,
        address: "Building 8, Technology Park, Nanshan District, Shenzhen, Guangdong 518000, China",
        contact: "Mr. Zhang Wei",
        email: "sales@szprecision.com",
        phone: "+86 755 8888 9999",
        products: ["Electronic Components", "PCB Assembly", "Custom Electronics"],
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on my analysis, I found a matching manufacturer:\n\n**${mockResult.name}**\n\nThis appears to be a **${mockResult.type}** with **${mockResult.confidence}%** confidence.\n\nI've populated the detailed information in the results panel.`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onResult(mockResult);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              message.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-xl p-4",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              )}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded"
                  className="rounded-lg mb-3 max-w-full h-auto max-h-48 object-cover"
                />
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-secondary text-secondary-foreground">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Analyzing...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview */}
      {uploadedImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img
              src={uploadedImage}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-lg border border-border"
            />
            <button
              onClick={() => setUploadedImage(null)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the product or upload an image..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-secondary border-border"
          />
          <Button onClick={handleSend} disabled={isLoading}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
