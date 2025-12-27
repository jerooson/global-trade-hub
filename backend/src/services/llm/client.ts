import Groq from "groq-sdk";
import OpenAI from "openai";
import { config } from "../../config/env.js";

// Anthropic is optional - will be dynamically imported if needed

export type LLMProvider = "groq" | "openai" | "anthropic";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

class LLMClient {
  private provider: LLMProvider;
  private groqClient?: Groq;
  private openaiClient?: OpenAI;
  private anthropicClient?: any;

  constructor() {
    // Determine which provider to use based on available API keys
    if (config.groqApiKey) {
      this.provider = "groq";
      this.groqClient = new Groq({ apiKey: config.groqApiKey });
      console.log("✅ Using Groq as LLM provider");
    } else if (config.openaiApiKey) {
      this.provider = "openai";
      this.openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
      console.log("✅ Using OpenAI as LLM provider");
    } else if (config.anthropicApiKey) {
      this.provider = "anthropic";
      // Anthropic will be initialized lazily when needed (lazy loading)
      console.log("✅ Using Anthropic as LLM provider (will load SDK on first use)");
    } else {
      throw new Error("No LLM API key configured. Please set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY");
    }
  }

  async chat(messages: LLMMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }): Promise<LLMResponse> {
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2000;

    try {
      switch (this.provider) {
        case "groq":
          return await this.chatGroq(messages, { temperature, maxTokens, model: options?.model });
        case "openai":
          return await this.chatOpenAI(messages, { temperature, maxTokens, model: options?.model });
        case "anthropic":
          if (!this.anthropicClient) {
            // Lazy load Anthropic SDK
            try {
              const AnthropicModule = await import("@anthropic-ai/sdk");
              const Anthropic = AnthropicModule.default;
              this.anthropicClient = new Anthropic({ apiKey: config.anthropicApiKey! });
            } catch (error) {
              throw new Error("Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk");
            }
          }
          return await this.chatAnthropic(messages, { temperature, maxTokens, model: options?.model });
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }
    } catch (error: any) {
      console.error("LLM API error:", error);
      console.error("Error message:", error?.message);
      console.error("Error code:", error?.code);
      console.error("Error status:", error?.status);
      if (error?.response) {
        console.error("Error response:", JSON.stringify(error.response, null, 2));
      }
      throw error;
    }
  }

  private async chatGroq(
    messages: LLMMessage[],
    options: { temperature: number; maxTokens: number; model?: string }
  ): Promise<LLMResponse> {
    if (!this.groqClient) {
      throw new Error("Groq client not initialized");
    }

    const response = await this.groqClient.chat.completions.create({
      model: options.model || "llama-3.3-70b-versatile", // Updated to current model
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    const message = response.choices[0]?.message?.content || "";
    const usage = response.usage;

    return {
      content: message,
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      } : undefined,
    };
  }

  private async chatOpenAI(
    messages: LLMMessage[],
    options: { temperature: number; maxTokens: number; model?: string }
  ): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const response = await this.openaiClient.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    const message = response.choices[0]?.message?.content || "";
    const usage = response.usage;

    return {
      content: message,
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      } : undefined,
    };
  }

  private async chatAnthropic(
    messages: LLMMessage[],
    options: { temperature: number; maxTokens: number; model?: string }
  ): Promise<LLMResponse> {
    if (!this.anthropicClient) {
      throw new Error("Anthropic client not initialized");
    }

    // Anthropic requires system message to be separate
    const systemMessage = messages.find(m => m.role === "system")?.content || "";
    const conversationMessages = messages.filter(m => m.role !== "system");

    const response = await this.anthropicClient.messages.create({
      model: options.model || "claude-3-5-haiku-20241022",
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: systemMessage || undefined,
      messages: conversationMessages.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    });

    const message = response.content[0]?.type === "text" 
      ? response.content[0].text 
      : "";
    const usage = response.usage;

    return {
      content: message,
      usage: usage ? {
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
      } : undefined,
    };
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}

// Singleton instance
let llmClientInstance: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (!llmClientInstance) {
    llmClientInstance = new LLMClient();
  }
  return llmClientInstance;
}

