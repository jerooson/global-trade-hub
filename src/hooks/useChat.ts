import { useState, useCallback, createContext, useContext, useEffect } from "react";
import { SearchResponse } from "@/services/api";
import { ManufacturerResult } from "@/components/sourcing/ManufacturerPanel";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  observability?: SearchResponse["observability"];
  parsedQuery?: SearchResponse["parsedQuery"];
  streamingObservability?: {
    currentStep: "idle" | "parsing" | "searching" | "deduplicating" | "filtering" | "complete";
    parsedQuery?: any;
    searchMethod?: "apify" | "firecrawl" | "mock";
    deduplication?: {
      beforeCount: number;
      afterCount: number;
    };
    filtering?: {
      beforeCount: number;
      afterCount: number;
      filtersApplied?: any;
    };
    processingSteps?: any;
  };
}

interface ChatContextType {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  input: string;
  setInput: (value: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  results: ManufacturerResult[];
  setResults: (results: ManufacturerResult[] | ((prev: ManufacturerResult[]) => ManufacturerResult[])) => void;
  clearResults: () => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "sourcing-chat-state";
const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Ready to find your ideal manufacturers. Upload a product image or describe what you're sourcing.\n\nI'll identify potential suppliers, rank them by confidence, and help you take the next step — whether that's shortlisting, comparing, or proceeding to pricing.",
  },
];

function loadFromStorage(): Partial<ChatContextType> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to load chat state from localStorage:", error);
  }
  return null;
}

function saveToStorage(state: Partial<ChatContextType>) {
  try {
    // Save messages, input, results, and panel state
    // Not saved: uploadedImage (base64 is too large), isLoading (UI state)
    const toSave = {
      messages: state.messages || [],
      input: state.input || "",
      results: state.results || [],
      isPanelOpen: state.isPanelOpen !== undefined ? state.isPanelOpen : true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.warn("Failed to save chat state to localStorage:", error);
  }
}

export function useChatProvider() {
  // Load initial state from localStorage
  const stored = loadFromStorage();
  
  const [messages, setMessages] = useState<ChatMessage[]>(
    stored?.messages && stored.messages.length > 0 ? stored.messages : DEFAULT_MESSAGES
  );
  const [input, setInput] = useState<string>(stored?.input || "");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResultsState] = useState<ManufacturerResult[]>(
    stored?.results || []
  );
  const [isPanelOpen, setIsPanelOpenState] = useState<boolean>(
    stored?.isPanelOpen !== undefined ? stored.isPanelOpen : true
  );

  // Save to localStorage whenever messages, input, results, or panel state change
  useEffect(() => {
    saveToStorage({
      messages,
      input,
      results,
      isPanelOpen,
    });
  }, [messages, input, results, isPanelOpen]);

  // Wrapper for setIsPanelOpen to ensure it's saved
  const setIsPanelOpen = useCallback((open: boolean) => {
    setIsPanelOpenState(open);
  }, []);

  // Wrapper for setResults that handles both direct values and function updates
  const setResults = useCallback((
    results: ManufacturerResult[] | ((prev: ManufacturerResult[]) => ManufacturerResult[])
  ) => {
    if (typeof results === "function") {
      setResultsState(results);
    } else {
      setResultsState(results);
    }
  }, []);

  // Add a new message
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Update an existing message by ID
  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  // Clear all messages (reset to default)
  const clearMessages = useCallback(() => {
    setMessages(DEFAULT_MESSAGES);
    setInput("");
    setUploadedImage(null);
    setResultsState([]);
    setIsPanelOpenState(true);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Clear results only
  const clearResults = useCallback(() => {
    setResultsState([]);
  }, []);

  return {
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    input,
    setInput,
    uploadedImage,
    setUploadedImage,
    isLoading,
    setIsLoading,
    results,
    setResults,
    clearResults,
    isPanelOpen,
    setIsPanelOpen,
  };
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

