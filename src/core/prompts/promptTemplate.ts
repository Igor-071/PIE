import OpenAI from "openai";
import { EvidenceDocument } from "../evidenceCollector.js";
import { PrdJson } from "../../models/schema.js";
import { retryWithBackoff } from "../retry.js";
import { getConfig } from "../../config.js";

export interface PromptContext {
  prdJson: PrdJson;
  evidence: EvidenceDocument[];
  tier1Data?: any;
}

export interface PromptResult {
  sectionData: any;
  questions?: Array<{
    field: string;
    question: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }>;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface SectionPrompt {
  name: string;
  systemPrompt: string;
  generateUserPrompt: (context: PromptContext) => string;
  parseResponse: (response: string) => any;
}

/**
 * Executes a section-specific prompt
 */
export async function executePrompt(
  prompt: SectionPrompt,
  context: PromptContext,
  options: { model?: string; temperature?: number } = {}
): Promise<PromptResult> {
  const config = getConfig();
  // Set timeout to 4.5 minutes (270000ms) to stay under Next.js maxDuration of 5 minutes
  const API_TIMEOUT_MS = 270000;
  const openai = new OpenAI({
    apiKey: config.openAiApiKey,
    timeout: API_TIMEOUT_MS,
  });

  const model = options.model ?? config.model;
  const temperature = options.temperature ?? 0.7;

  const userMessage = prompt.generateUserPrompt(context);

  try {
    // Wrap API call with explicit timeout to prevent hanging
    const completion = await Promise.race([
      retryWithBackoff(
        async () => {
          return await openai.chat.completions.create({
            model,
            messages: [
              { role: "system", content: prompt.systemPrompt },
              { role: "user", content: userMessage },
            ],
            response_format: { type: "json_object" },
            temperature,
          });
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 30000,
          backoffMultiplier: 2,
          retryableErrors: ["429", "rate_limit", "timeout", "ECONNRESET", "ETIMEDOUT", "Request timed out"],
        }
      ),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timed out after ${API_TIMEOUT_MS / 1000} seconds for prompt ${prompt.name}. The analysis may be too large.`));
        }, API_TIMEOUT_MS);
      }),
    ]);

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error(`Empty response from OpenAI API for ${prompt.name}`);
    }

    const parsed = JSON.parse(responseContent);
    const result = prompt.parseResponse(JSON.stringify(parsed));
    
    // Extract token usage from API response
    const tokenUsage = completion.usage ? {
      promptTokens: completion.usage.prompt_tokens || 0,
      completionTokens: completion.usage.completion_tokens || 0,
      totalTokens: completion.usage.total_tokens || 0,
    } : undefined;

    return {
      ...result,
      tokenUsage,
    };
  } catch (error) {
    // Provide more specific error messages for timeout errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        console.error(`[PromptTemplate] Timeout error for ${prompt.name}: ${error.message}`);
        throw new Error(`Prompt execution failed for ${prompt.name}: Request timed out. The analysis may be too large. Consider reducing evidence size or using a faster model.`);
      }
    }
    throw new Error(`Prompt execution failed for ${prompt.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Executes multiple prompts in sequence
 */
export async function executePrompts(
  prompts: SectionPrompt[],
  context: PromptContext,
  options: { 
    model?: string; 
    temperature?: number;
    onProgress?: (completed: number, total: number, currentPromptName: string) => void;
  } = {}
): Promise<Record<string, PromptResult>> {
  const results: Record<string, PromptResult> = {};
  const total = prompts.length;

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    try {
      console.log(`Executing prompt: ${prompt.name}...`);
      results[prompt.name] = await executePrompt(prompt, context, options);
      
      // Call progress callback after each prompt completes
      if (options.onProgress) {
        options.onProgress(i + 1, total, prompt.name);
      }
    } catch (error) {
      console.error(`Failed to execute prompt ${prompt.name}:`, error);
      // Continue with other prompts even if one fails
      // Still call progress callback to indicate we attempted this prompt
      if (options.onProgress) {
        options.onProgress(i + 1, total, prompt.name);
      }
    }
  }

  return results;
}

