import OpenAI from "openai";
import { getConfig } from "../config.js";
import { chunkEvidence, estimateTokens } from "./tokenCounter.js";
import { retryWithBackoff } from "./retry.js";
/**
 * Runs the Tier 2 AI agent to fill strategic fields in the PRD JSON
 * @param baseJson - Initial PRD JSON with Tier 1 data populated
 * @param evidence - Evidence documents collected from the repository
 * @param options - Options including maxQuestions and model
 * @returns Promise resolving to Tier2Result with updated JSON and questions
 */
export async function runTier2Agent(baseJson, evidence, options = {}) {
    const config = getConfig();
    const openai = new OpenAI({
        apiKey: config.openAiApiKey,
    });
    const maxQuestions = options.maxQuestions ?? 7;
    const model = options.model ?? config.model;
    // Build system prompt with detailed guidance
    const systemPrompt = `You are an expert Product Intelligence Engine and senior product manager responsible for analyzing codebases and generating comprehensive Product Requirements Documents (PRDs).

## Your Mission

Transform technical code analysis and evidence documents into a rich, strategic PRD following this custom schema structure.

## Core Principles

1. **Infer Intelligently**: Screen names like "PatientPortal", "Inventory", "Dashboard" reveal features and user types
2. **Be Specific**: Don't write vague statements. Use concrete details from code structure
3. **Think Like a PM**: Consider the business model, target users, and competitive positioning
4. **Fill Everything Possible**: Better to make educated guesses than leave fields empty

## Custom Schema Fields to Populate

### brandFoundations
- mission: Company mission statement
- vision: Long-term vision
- coreValues: Array of company values
- problemStatement: What problem this solves
- solutionStatement: How it solves it
- toneOfVoice: Brand communication style
- brandEthos, brandArchetype, brandPromise

### targetAudience (array of personas)
Each persona should have:
- name: Persona name (e.g., "Medical Providers", "Patients")
- demographics: Age, location, job titles
- psychographics: Lifestyle, attitudes
- goals: What they want to achieve
- painPoints: Their frustrations (as quotes if possible)
- jobsToBeDone: Tasks they need to complete

### problemDefinition
- primaryProblem: Core problem being solved
- secondaryProblems: Related issues
- userPainPoints: Specific user frustrations
- businessImpact: How problem affects business

### solutionOverview
- valueProposition: Why users should choose this
- keyFeatures: Core capabilities
- differentiators: What makes it unique
- nonFunctionalRequirements: Performance, security needs

### leanCanvas
- uniqueValueProposition
- customerSegments
- keyMetrics
- channels
- costStructure, revenueStreams

### Other strategic fields
- positioningAndMessaging
- competitiveAnalysis
- customerProfiles

## Inference Strategy

### From Screen Names
- "PatientPortal" + "PatientRecords" → Healthcare domain, patient management
- "Dashboard" + "Reports" → Analytics capability
- "Inventory" + "Stock" → Inventory management feature
- "Schedule" + "Calendar" → Scheduling system

### From Data Models
- Models named "Patient", "Treatment", "Implant" → Medical/healthcare
- Models named "Order", "Product", "Cart" → E-commerce
- Infer personas from entity types

### From API Endpoints
- POST /api/appointments → Appointment booking feature
- GET /api/patients → Patient data retrieval
- Infer capabilities from endpoints

## Output Requirements

Return valid JSON with this structure:
{
  "updatedJson": { ...complete PrdJson with strategic fields filled... },
  "questionsForClient": {
    "questions": [
      {
        "field": "brandFoundations.mission",
        "question": "What is the core mission?",
        "reason": "Not found in evidence",
        "priority": "high" | "medium" | "low"
      }
    ],
    "generatedAt": "ISO timestamp"
  }
}

CRITICAL OUTPUT REQUIREMENTS:
1. You MUST return the COMPLETE PrdJson object including ALL existing fields
2. Keep ALL technical fields EXACTLY as provided: project, screens, navigation, api, dataModel, state, events, aiMetadata
3. Only ADD/UPDATE the strategic fields: brandFoundations, targetAudience, problemDefinition, solutionOverview, leanCanvas, etc.
4. DO NOT remove or omit any fields from the input JSON
5. Your output should be the FULL merged object, not just the strategic fields`;
    // Chunk evidence to fit within token limits
    const chunkedEvidence = chunkEvidence(evidence);
    // Build user message with context
    const evidenceSummary = chunkedEvidence.map((doc) => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        contentPreview: doc.content.substring(0, 500) + (doc.content.length > 500 ? "..." : ""),
    }));
    const baseJsonString = JSON.stringify(baseJson, null, 2);
    const baseJsonTokens = estimateTokens(baseJsonString);
    // Estimate total tokens
    const evidenceContent = chunkedEvidence.map((doc) => `\n--- ${doc.title} (${doc.type}) ---\n${doc.content}`).join("\n\n");
    const evidenceTokens = estimateTokens(evidenceContent);
    const totalEstimatedTokens = baseJsonTokens + evidenceTokens + estimateTokens(systemPrompt);
    if (totalEstimatedTokens > 100000) {
        console.warn(`Warning: Estimated token count (${totalEstimatedTokens}) is high.`);
    }
    // Extract key insights for guidance
    const screenCount = baseJson.screens?.length || 0;
    const navCount = baseJson.navigation?.length || 0;
    const apiCount = baseJson.api?.length || 0;
    const screenNames = baseJson.screens?.slice(0, 10).map(s => s.name).join(", ") || "None";
    const userMessage = `# Task: Generate Comprehensive PRD from Codebase Analysis

## Current PRD JSON (Technical Data Extracted)
${baseJsonString}

## Evidence Documents (${chunkedEvidence.length})
${JSON.stringify(evidenceSummary, null, 2)}

## Full Evidence
${evidenceContent}

---

## Analysis Guidance

**Project**: "${baseJson.project?.name || 'Unknown'}"
**Screens detected**: ${screenCount}
**Navigation routes**: ${navCount}
**API endpoints**: ${apiCount}
**Key screens**: ${screenNames}

### Inference Task

Based on screen names, data models, and patterns:
1. **Identify domain**: What industry is this? (healthcare, e-commerce, fintech, etc.)
2. **Identify user types**: Who uses different screens? (patients vs providers, customers vs admins)
3. **Infer problems**: What pain points does this solve?
4. **Extract features**: What capabilities does it provide?
5. **Define personas**: Create 2-3 detailed user personas with:
   - Realistic names and roles
   - Demographics (job title, context)
   - Goals (what they want to achieve)
   - Pain points (frustrations as first-person quotes if possible)
   - Jobs to be done (tasks they complete)

Fill ALL strategic fields with your best analysis. Generate up to ${maxQuestions} questions for missing information.`;
    try {
        const completion = await retryWithBackoff(async () => {
            return await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage },
                ],
                response_format: { type: "json_object" },
                temperature: 0.8, // Higher for creative strategic content
            });
        }, {
            maxRetries: 3,
            initialDelayMs: 1000,
            maxDelayMs: 30000,
            backoffMultiplier: 2,
            retryableErrors: ["429", "rate_limit", "timeout", "ECONNRESET", "ETIMEDOUT"],
        });
        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) {
            throw new Error("Empty response from OpenAI API");
        }
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseContent);
        }
        catch (parseError) {
            throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
        if (!parsedResponse.updatedJson) {
            throw new Error("Response missing 'updatedJson' field");
        }
        if (!parsedResponse.questionsForClient) {
            throw new Error("Response missing 'questionsForClient' field");
        }
        if (!parsedResponse.questionsForClient.generatedAt) {
            parsedResponse.questionsForClient.generatedAt = new Date().toISOString();
        }
        // CRITICAL: Ensure technical fields are preserved by merging with base JSON
        // AI sometimes omits fields even when told not to
        const mergedJson = {
            ...baseJson, // Start with all technical fields
            ...parsedResponse.updatedJson, // Overlay strategic fields from AI
            // Explicitly preserve critical technical fields to prevent AI from removing them
            project: baseJson.project,
            screens: baseJson.screens,
            navigation: baseJson.navigation,
            api: baseJson.api,
            dataModel: baseJson.dataModel,
            state: baseJson.state,
            events: baseJson.events,
            aiMetadata: baseJson.aiMetadata,
        };
        return {
            updatedJson: mergedJson,
            questionsForClient: parsedResponse.questionsForClient,
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Tier 2 agent failed: ${error.message}`);
        }
        throw new Error(`Tier 2 agent failed: ${String(error)}`);
    }
}
//# sourceMappingURL=tier2Agent.js.map