import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { search1688Tool, classifyManufacturerTool, extractDetailsTool } from "./tools.js";
import { ParsedQuery } from "../../models/manufacturer.js";
import { config } from "../../config/env.js";
import { getLLMClient } from "../llm/client.js";

/**
 * Parse natural language query to extract structured search parameters
 */
export async function parseQuery(query: string): Promise<ParsedQuery> {
  const llmClient = getLLMClient();
  
  const prompt = `Parse this user query about finding manufacturers and extract structured information.

User Query: "${query}"

Extract:
1. Product type or category (e.g., "LED", "Semiconductors", "PCB")
2. Location preferences (cities or provinces in China)
3. Query type (manufacturer search or product search)
4. Any specifications or requirements

Return a JSON object with this structure:
{
  "product": "extracted product name or category",
  "location": ["array of location names if mentioned"],
  "type": "manufacturer" or "product",
  "specifications": {
    "key": "value pairs of any specifications mentioned"
  }
}

Only return the JSON, no other text.`;

  try {
    const response = await llmClient.chat([
      {
        role: "system",
        content: "You are an expert at parsing trade and manufacturing queries. Extract structured information from natural language.",
      },
      {
        role: "user",
        content: prompt,
      },
    ], {
      temperature: 0.3,
      maxTokens: 500,
    });

    // Parse JSON response
    const content = response.content.trim();
    let jsonStr = content;
    
    // Handle markdown code blocks
    if (content.startsWith("```json")) {
      jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (content.startsWith("```")) {
      jsonStr = content.replace(/```\n?/g, "").trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      product: parsed.product || query, // Fallback to original query
      location: parsed.location || [],
      type: parsed.type || "manufacturer",
      specifications: parsed.specifications || {},
    };
  } catch (error: any) {
    console.error("Error parsing query:", error);
    
    // Fallback: return basic structure
    return {
      product: query,
      location: [],
      type: "manufacturer",
      specifications: {},
    };
  }
}

/**
 * Create LangChain agent for complex orchestration (optional - for future use)
 */
export async function createSourcingAgent(): Promise<AgentExecutor | null> {
  // Check for available API keys
  if (!config.anthropicApiKey && !config.openaiApiKey) {
    console.warn("No API key found for LangChain agent. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
    return null;
  }

  try {
    // Initialize LLM based on available API keys (prefer Anthropic)
    let llm;
    if (config.anthropicApiKey) {
      llm = new ChatAnthropic({
        modelName: "claude-3-5-sonnet-20241022",
        temperature: 0.3,
        anthropicApiKey: config.anthropicApiKey,
      });
      console.log("Using ChatAnthropic for LangChain agent");
    } else if (config.openaiApiKey) {
      llm = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.3,
        openAIApiKey: config.openaiApiKey,
      });
      console.log("Using ChatOpenAI for LangChain agent");
    } else {
      return null;
    }

    const tools = [search1688Tool, classifyManufacturerTool, extractDetailsTool];

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a helpful assistant that helps users find manufacturers on 1688.com.
You have access to tools to:
1. Search 1688.com for manufacturers
2. Classify manufacturers as factories or trading companies
3. Extract detailed information from manufacturer pages

Use these tools to help users find the best manufacturers for their needs.`],
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });
  } catch (error) {
    console.error("Error creating LangChain agent:", error);
    return null;
  }
}

