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
  const openai = new OpenAI({
    apiKey: config.openAiApiKey,
  });

  const model = options.model ?? config.model;
  const temperature = options.temperature ?? 0.7;

  const userMessage = prompt.generateUserPrompt(context);

  try {
    const completion = await retryWithBackoff(
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
        retryableErrors: ["429", "rate_limit", "timeout", "ECONNRESET", "ETIMEDOUT"],
      }
    );

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error(`Empty response from OpenAI API for ${prompt.name}`);
    }

    const parsed = JSON.parse(responseContent);
    return prompt.parseResponse(JSON.stringify(parsed));
  } catch (error) {
    throw new Error(`Prompt execution failed for ${prompt.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Executes multiple prompts in sequence
 */
export async function executePrompts(
  prompts: SectionPrompt[],
  context: PromptContext,
  options: { model?: string; temperature?: number } = {}
): Promise<Record<string, PromptResult>> {
  const results: Record<string, PromptResult> = {};

  for (const prompt of prompts) {
    try {
      console.log(`Executing prompt: ${prompt.name}...`);
      results[prompt.name] = await executePrompt(prompt, context, options);
    } catch (error) {
      console.error(`Failed to execute prompt ${prompt.name}:`, error);
      // Continue with other prompts even if one fails
    }
  }

  return results;
}

