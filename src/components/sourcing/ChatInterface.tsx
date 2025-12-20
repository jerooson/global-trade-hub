import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ImagePlus, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManufacturerResult } from "./ManufacturerPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ChatInterfaceProps {
  onResults: (results: ManufacturerResult[]) => void;
}

export function ChatInterface({ onResults }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Ready to find your ideal manufacturers. Upload a product image or describe what you're sourcing.\n\nI'll identify potential suppliers, rank them by confidence, and help you take the next step — whether that's shortlisting, comparing, or proceeding to pricing.",
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

    setTimeout(() => {
      const mockResults: ManufacturerResult[] = [
        {
          id: "1",
          name: "Shenzhen Precision Electronics Co., Ltd",
          type: "Factory",
          confidence: 92,
          address: "Building 8, Technology Park, Nanshan District, Shenzhen, Guangdong 518000, China",
          contact: "Mr. Zhang Wei",
          email: "sales@szprecision.com",
          phone: "+86 755 8888 9999",
          products: ["Electronic Components", "PCB Assembly", "Custom Electronics"],
        },
        {
          id: "2",
          name: "Guangzhou Global Trade Co., Ltd",
          type: "Trading Company",
          confidence: 78,
          address: "Floor 12, International Trade Center, Tianhe District, Guangzhou, Guangdong 510620, China",
          contact: "Ms. Li Mei",
          email: "info@gzglobaltrade.com",
          phone: "+86 20 3888 7777",
          products: ["Electronics", "Consumer Goods", "Industrial Parts"],
        },
        {
          id: "3",
          name: "Dongguan Smart Manufacturing Ltd",
          type: "Factory",
          confidence: 85,
          address: "No. 88 Industrial Road, Changan Town, Dongguan, Guangdong 523850, China",
          contact: "Mr. Chen Jun",
          email: "business@dgsmart.cn",
          phone: "+86 769 8123 4567",
          products: ["Smart Devices", "IoT Components", "Wearables"],
        },
        {
          id: "4",
          name: "Ningbo Ocean Export Trading",
          type: "Trading Company",
          confidence: 65,
          address: "Building C, Free Trade Zone, Beilun District, Ningbo, Zhejiang 315800, China",
          contact: "Mr. Wang Tao",
          email: "export@nbocean.com",
          phone: "+86 574 8765 4321",
          products: ["Mixed Electronics", "Hardware", "Plastic Components"],
        },
        {
          id: "5",
          name: "Foshan Quality Products Factory",
          type: "Factory",
          confidence: 71,
          address: "Zone B, Shishan Industrial Park, Nanhai District, Foshan, Guangdong 528200, China",
          contact: "Ms. Huang Ying",
          email: "quality@fsproducts.com",
          phone: "+86 757 8888 1234",
          products: ["Metal Parts", "Precision Tools", "Industrial Equipment"],
        },
      ];

      const topMatch = mockResults.sort((a, b) => b.confidence - a.confidence)[0];
      const factoryCount = mockResults.filter((r) => r.type === "Factory").length;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I've identified **${mockResults.length} potential manufacturers** ranked by confidence.\n\n**Top candidates are likely direct factories** with strong product focus. ${factoryCount} factories and ${mockResults.length - factoryCount} trading companies found.\n\n**Recommended next steps:**\n• Review details and **shortlist** preferred suppliers\n• Use filters to narrow by type or confidence\n• **Proceed to pricing** when ready`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onResults(mockResults);
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
            className={cn("flex gap-3 animate-fade-in", message.role === "user" ? "flex-row-reverse" : "")}
          >
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-xl p-4",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
              )}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded"
                  className="rounded-lg mb-3 max-w-full h-auto max-h-48 object-cover"
                />
              )}
              <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                {message.content.split("\n").map((line, i) => (
                  <p key={i} className="mb-1 last:mb-0">
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j}>{part.slice(2, -2)}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
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
                <span className="text-sm text-muted-foreground">Analyzing and matching manufacturers...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview */}
      {uploadedImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img src={uploadedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
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
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
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
