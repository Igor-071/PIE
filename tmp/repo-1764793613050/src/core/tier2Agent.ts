import OpenAI from "openai";
import { getConfig } from "../config.js";
import {
  PrdJson,
  StrategicText,
  QuestionsForClient,
  ClientQuestion,
} from "../models/schema.js";
import { EvidenceDocument } from "./evidenceCollector.js";

export interface Tier2Result {
  updatedJson: PrdJson;
  questionsForClient: QuestionsForClient;
}

export interface Tier2AgentOptions {
  maxQuestions?: number;
  model?: string;
}

/**
 * Runs the Tier 2 AI agent to fill strategic fields in the PRD JSON
 * @param baseJson - Initial PRD JSON with Tier 1 data populated
 * @param evidence - Evidence documents collected from the repository
 * @param options - Options including maxQuestions and model
 * @returns Promise resolving to Tier2Result with updated JSON and questions
 */
export async function runTier2Agent(
  baseJson: PrdJson,
  evidence: EvidenceDocument[],
  options: Tier2AgentOptions = {}
): Promise<Tier2Result> {
  const config = getConfig();
  const openai = new OpenAI({
    apiKey: config.openAiApiKey,
  });

  const maxQuestions = options.maxQuestions ?? 7;
  const model = options.model ?? config.model;

  // Build system prompt
  const systemPrompt = `You are a Product Intelligence Engine agent responsible for filling Tier 2 strategic fields in a Product Requirements Document (PRD).

Your task:
1. Analyze the provided PRD JSON (which contains Tier 1 technical data extracted from code)
2. Use the evidence documents (README, docs, brief) to fill Tier 2 strategic fields
3. Wrap ALL strategic field values in StrategicText objects with:
   - value: the actual text (or null if unknown)
   - confidence: "high" | "medium" | "low" | "unknown"
   - sourceType: one of "uploaded_brief" | "repo_readme" | "repo_docs" | "model_inference" | "other"
   - sources: optional array of source identifiers
   - notes: optional notes about the extraction

4. Generate client questions for missing or low-confidence fields (max ${maxQuestions} questions)

Rules:
- Use evidence documents when available (high confidence)
- Infer from code structure when evidence is missing (low confidence)
- If completely unknown, set value to null and confidence to "unknown"
- Never modify Tier 1 fields
- Return valid JSON matching the PrdJson structure

Return a JSON object with this structure:
{
  "updatedJson": { ...PrdJson... },
  "questionsForClient": {
    "questions": [ ...ClientQuestion[]... ],
    "generatedAt": "ISO timestamp"
  }
}`;

  // Build user message with context
  const evidenceSummary = evidence.map((doc) => ({
    id: doc.id,
    type: doc.type,
    title: doc.title,
    contentPreview: doc.content.substring(0, 500) + (doc.content.length > 500 ? "..." : ""),
  }));

  const userMessage = `Please analyze this PRD and fill Tier 2 strategic fields.

Current PRD JSON:
${JSON.stringify(baseJson, null, 2)}

Evidence Documents (${evidence.length}):
${JSON.stringify(evidenceSummary, null, 2)}

Full evidence content:
${evidence.map((doc) => `\n--- ${doc.title} (${doc.type}) ---\n${doc.content}`).join("\n\n")}

Generate up to ${maxQuestions} follow-up questions for missing or low-confidence areas.`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI API");
    }

    // Parse JSON response
    let parsedResponse: {
      updatedJson?: PrdJson;
      questionsForClient?: QuestionsForClient;
    };

    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      throw new Error(
        `Failed to parse JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }

    // Validate response structure
    if (!parsedResponse.updatedJson) {
      throw new Error("Response missing 'updatedJson' field");
    }

    if (!parsedResponse.questionsForClient) {
      throw new Error("Response missing 'questionsForClient' field");
    }

    // Ensure questionsForClient has generatedAt if missing
    if (!parsedResponse.questionsForClient.generatedAt) {
      parsedResponse.questionsForClient.generatedAt = new Date().toISOString();
    }

    return {
      updatedJson: parsedResponse.updatedJson,
      questionsForClient: parsedResponse.questionsForClient,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Tier 2 agent failed: ${error.message}`);
    }
    throw new Error(`Tier 2 agent failed: ${String(error)}`);
  }
}
