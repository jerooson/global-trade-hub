import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ImagePlus, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManufacturerResult } from "./ManufacturerPanel";
import { searchManufacturers, SearchResponse } from "@/services/api";
import { ObservabilityPanel } from "./ObservabilityPanel";
import { useChat, ChatMessage } from "@/hooks/useChat";

interface ChatInterfaceProps {
  onResults?: (results: ManufacturerResult[]) => void; // Optional for backward compatibility
}

export function ChatInterface({ onResults }: ChatInterfaceProps) {
  // Use context for persistent state
  const {
    messages,
    addMessage,
    updateMessage,
    input,
    setInput,
    uploadedImage,
    setUploadedImage,
    isLoading,
    setIsLoading,
    results,
    setResults,
  } = useChat();
  
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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input || "Analyzing uploaded image...",
      image: uploadedImage || undefined,
    };

    addMessage(userMessage);
    const query = input;
    setInput("");
    setUploadedImage(null);
    setIsLoading(true);

    let useTimeoutFallback = false;

    try {
      // Call the backend API with streaming
      const streamingResults: ManufacturerResult[] = [];
      let streamingParsedQuery: any = null;
      let streamingObservability: any = null;
      let messageId = (Date.now() + 1).toString();
      
      // Track streaming observability state
      const streamingObsState: any = {
        currentStep: "parsing",
        parsedQuery: null,
        searchMethod: null,
        deduplication: null,
        filtering: null,
        processingSteps: null,
      };
      
      // Create initial loading message
      const loadingMessage: ChatMessage = {
        id: messageId,
        role: "assistant",
        content: "Parsing your query...",
        streamingObservability: streamingObsState,
      };
      addMessage(loadingMessage);

      const response = await searchManufacturers(
        {
          query,
          imageUrl: uploadedImage || undefined,
        },
        {
          onStream: (event) => {
            if (event.type === "parsed") {
              streamingParsedQuery = event.data;
              
              // Create NEW object to trigger React re-render
              const newObsState = {
                ...streamingObsState,
                currentStep: "searching" as const,
                parsedQuery: event.data,
              };
              Object.assign(streamingObsState, newObsState);
              
              // Update message with parsed query info
              updateMessage(messageId, {
                content: `Parsed your query: **${event.data.product}**${event.data.location ? ` in ${event.data.location.join(", ")}` : ""}${event.data.category ? ` (${event.data.category}${event.data.subcategory ? ` - ${event.data.subcategory}` : ""})` : ""}\n\nSearching manufacturers...`,
                parsedQuery: event.data,
                streamingObservability: newObsState,
              });
            } else if (event.type === "progress") {
              // Handle progress updates for different steps
              const progressData = event.data;
              let newObsState;
              
              if (progressData.step === "searching") {
                newObsState = {
                  ...streamingObsState,
                  currentStep: "searching" as const,
                  searchMethod: progressData.searchMethod,
                };
                Object.assign(streamingObsState, newObsState);
                updateMessage(messageId, {
                  content: `Searching ${progressData.message || "manufacturers"}...`,
                  streamingObservability: newObsState,
                });
              } else if (progressData.step === "deduplicating") {
                newObsState = {
                  ...streamingObsState,
                  currentStep: "deduplicating" as const,
                  deduplication: {
                    beforeCount: progressData.beforeCount,
                    afterCount: progressData.afterCount,
                  },
                };
                Object.assign(streamingObsState, newObsState);
                updateMessage(messageId, {
                  content: `Processing results: ${progressData.beforeCount} → ${progressData.afterCount} unique manufacturers...`,
                  streamingObservability: newObsState,
                });
              } else if (progressData.step === "filtering") {
                newObsState = {
                  ...streamingObsState,
                  currentStep: "filtering" as const,
                  filtering: {
                    beforeCount: progressData.beforeCount,
                    afterCount: progressData.afterCount,
                    filtersApplied: progressData.filtersApplied,
                  },
                };
                Object.assign(streamingObsState, newObsState);
                updateMessage(messageId, {
                  content: `Applying filters: ${progressData.beforeCount} → ${progressData.afterCount} results...`,
                  streamingObservability: newObsState,
                });
              }
            } else if (event.type === "result") {
              streamingResults.push(event.data);
              // DON'T update results in real-time - wait for final filtered results
              // Just update the message to show progress
              const factoryCount = streamingResults.filter((r) => r.type === "Factory").length;
              updateMessage(messageId, {
                content: `Found **${streamingResults.length} manufacturer${streamingResults.length !== 1 ? "s" : ""}** so far...\n\nProcessing and filtering results...`,
                observability: streamingObservability,
                parsedQuery: streamingParsedQuery,
                streamingObservability: { ...streamingObsState },
              });
            } else if (event.type === "complete") {
              streamingObservability = event.data.observability;
              
              const newObsState = {
                ...streamingObsState,
                currentStep: "complete" as const,
                processingSteps: event.data.observability?.processingSteps,
              };
              Object.assign(streamingObsState, newObsState);
              
              // Use finalResults from backend (filtered & limited) instead of all streamed results
              const finalResults = event.data.finalResults || streamingResults;
              const factoryCount = finalResults.filter((r) => r.type === "Factory").length;
              
              // Update final message
              updateMessage(messageId, {
                content: `I've identified **${finalResults.length} potential manufacturer${finalResults.length !== 1 ? "s" : ""}** ranked by confidence.\n\n**Top candidates are likely direct factories** with strong product focus. ${factoryCount} factories and ${finalResults.length - factoryCount} trading companies found.\n\n**Recommended next steps:**\n• Review details and **shortlist** preferred suppliers\n• Use filters to narrow by type or confidence\n• **Proceed to pricing** when ready`,
                observability: streamingObservability,
                parsedQuery: streamingParsedQuery,
                streamingObservability: newObsState,
              });
              setResults(finalResults);
              onResults?.(finalResults);
            } else if (event.type === "error") {
              updateMessage(messageId, {
                content: `Error: ${event.data}`,
              });
            }
          },
        }
      );

      // If non-streaming response (fallback), handle normally
      if (response && !streamingResults.length) {
        const results = response.results;
        const factoryCount = results.filter((r) => r.type === "Factory").length;

        const assistantMessage: ChatMessage = {
          id: messageId,
          role: "assistant",
          content: `I've identified **${results.length} potential manufacturers** ranked by confidence.\n\n**Top candidates are likely direct factories** with strong product focus. ${factoryCount} factories and ${results.length - factoryCount} trading companies found.\n\n**Recommended next steps:**\n• Review details and **shortlist** preferred suppliers\n• Use filters to narrow by type or confidence\n• **Proceed to pricing** when ready`,
          observability: response.observability,
          parsedQuery: response.parsedQuery,
        };

        updateMessage(messageId, assistantMessage);
        setResults(results);
        onResults?.(results);
      }
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

          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I've identified **${mockResults.length} potential manufacturers** ranked by confidence.\n\n**Top candidates are likely direct factories** with strong product focus. 1 factory and 1 trading company found.\n\n**Note:** API is not connected, showing mock data.\n\n**Recommended next steps:**\n• Review details and **shortlist** preferred suppliers\n• Use filters to narrow by type or confidence\n• **Proceed to pricing** when ready`,
          };

          addMessage(assistantMessage);
          setResults(mockResults);
          onResults?.(mockResults);
          setIsLoading(false);
        }, 1500);
      } else {
        // For other errors, show error message
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, I encountered an error while searching: ${error.message}\n\nPlease try again or contact support if the issue persists.`,
        };

        addMessage(errorMessage);
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
              {message.role === "assistant" && (message.observability || message.parsedQuery || message.streamingObservability) && (
                <div className="mt-3">
                  <ObservabilityPanel
                    response={message.observability || message.parsedQuery ? {
                      parsedQuery: message.parsedQuery || { product: "" },
                      observability: message.observability,
                    } as SearchResponse : undefined}
                    streamingData={message.streamingObservability}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
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
