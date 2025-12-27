import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ImagePlus, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManufacturerResult } from "./ManufacturerPanel";
import { searchManufacturers } from "@/services/api";

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
    const query = input;
    setInput("");
    setUploadedImage(null);
    setIsLoading(true);

    let useTimeoutFallback = false;

    try {
      // Call the backend API
      const response = await searchManufacturers({
        query,
        imageUrl: uploadedImage || undefined,
      });

      const results = response.results;
      const factoryCount = results.filter((r) => r.type === "Factory").length;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I've identified **${results.length} potential manufacturers** ranked by confidence.\n\n**Top candidates are likely direct factories** with strong product focus. ${factoryCount} factories and ${results.length - factoryCount} trading companies found.\n\n**Recommended next steps:**\n• Review details and **shortlist** preferred suppliers\n• Use filters to narrow by type or confidence\n• **Proceed to pricing** when ready`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onResults(results);
    } catch (error: any) {
      console.error("Search error:", error);

      // If API is not connected, use setTimeout to simulate response
      if (error.message?.includes("fetch") || error.message?.includes("Network") || error.code === "ERR_NETWORK") {
        console.log("API not connected, using mock data with setTimeout");
        useTimeoutFallback = true;

        setTimeout(() => {
          const mockResults: ManufacturerResult[] = [
            {
              id: "1",
              name: "Shenzhen Tech Manufacturing Co., Ltd",
              type: "Factory" as const,
              confidence: 95,
              address: "Building 5, Industrial Park, Bao'an District, Shenzhen, Guangdong, China",
              contact: "Zhang Wei",
              email: "sales@shenzhentech.com",
              phone: "+86 755 1234 5678",
              products: ["LED Displays", "LED Lighting", "PCB Assembly", "Electronic Components"],
            },
            {
              id: "2",
              name: "Guangzhou Electronics Trading",
              type: "Trading Company" as const,
              confidence: 78,
              address: "Room 1203, Trade Center, Tianhe District, Guangzhou, Guangdong, China",
              contact: "Li Ming",
              email: "info@gzelectronics.com",
              phone: "+86 20 8765 4321",
              products: ["Semiconductors", "Capacitors", "Resistors", "IC Chips"],
            },
          ];

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I've identified **${mockResults.length} potential manufacturers** ranked by confidence.\n\n**Top candidates are likely direct factories** with strong product focus. 1 factory and 1 trading company found.\n\n**Note:** API is not connected, showing mock data.\n\n**Recommended next steps:**\n• Review details and **shortlist** preferred suppliers\n• Use filters to narrow by type or confidence\n• **Proceed to pricing** when ready`,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          onResults(mockResults);
          setIsLoading(false);
        }, 1500);
      } else {
        // For other errors, show error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, I encountered an error while searching: ${error.message}\n\nPlease try again or contact support if the issue persists.`,
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      // Only set loading to false if not using setTimeout fallback
      if (!useTimeoutFallback) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
        <div className="px-4 pb-2 flex-shrink-0">
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

      {/* Input - Fixed at bottom */}
      <div className="p-4 border-t border-border flex-shrink-0">
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
