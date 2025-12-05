import OpenAI from "openai";
import { getConfig } from "../config.js";
import { chunkEvidence, estimateTokens } from "./tokenCounter.js";
import { retryWithBackoff } from "./retry.js";
// Max evidence tokens constant (not exported from tokenCounter, so define here)
const MAX_EVIDENCE_TOKENS = 110000;
/**
 * Creates a summarized version of base JSON for Tier 2 analysis
 * Tier 2 only needs high-level information for business strategy,
 * not the full technical details that add ~13k tokens
 */
function summarizeBaseJsonForTier2(baseJson) {
    // Handle dataModel which can be either DataModel (Record) or EnhancedDataModel (object with entities)
    let dataModelNames = [];
    let dataModelCount = 0;
    if (baseJson.dataModel) {
        if ('entities' in baseJson.dataModel) {
            // EnhancedDataModel
            dataModelNames = Object.keys(baseJson.dataModel.entities || {}).slice(0, 15);
            dataModelCount = Object.keys(baseJson.dataModel.entities || {}).length;
        }
        else {
            // DataModel
            dataModelNames = Object.keys(baseJson.dataModel).slice(0, 15);
            dataModelCount = Object.keys(baseJson.dataModel).length;
        }
    }
    return {
        project: baseJson.project,
        summary: {
            screens: {
                count: baseJson.screens?.length || 0,
                names: baseJson.screens?.slice(0, 15).map(s => s.name) || [],
                paths: baseJson.screens?.slice(0, 10).map(s => s.path).filter(Boolean) || [],
            },
            navigation: {
                count: baseJson.navigation?.length || 0,
                paths: baseJson.navigation?.slice(0, 10).map(n => n.path) || [],
            },
            api: {
                count: baseJson.api?.length || 0,
                endpoints: baseJson.api?.slice(0, 15).map(a => `${a.method} ${a.endpoint}`) || [],
            },
            dataModel: {
                count: dataModelCount,
                models: dataModelNames,
            },
            state: {
                hasGlobalState: !!baseJson.state?.global,
                globalStateKeys: baseJson.state?.global ? Object.keys(baseJson.state.global).slice(0, 10) : [],
            },
            events: {
                count: baseJson.events?.length || 0,
                types: [...new Set(baseJson.events?.map(e => e.type))].slice(0, 5) || [],
            },
        },
        // Include AI metadata for tech stack info
        aiMetadata: baseJson.aiMetadata,
    };
}
/**
 * Runs the Tier 2 AI agent to fill strategic fields in the PRD JSON
 * @param baseJson - Initial PRD JSON with Tier 1 data populated
 * @param evidence - Evidence documents collected from the repository
 * @param options - Options including maxQuestions and model
 * @returns Promise resolving to Tier2Result with updated JSON and questions
 */
export async function runTier2Agent(baseJson, evidence, options = {}) {
    // Try with full evidence first, then retry with reduced evidence on timeout
    try {
        return await runTier2AgentInternal(baseJson, evidence, options, false);
    }
    catch (error) {
        // Check if it's a timeout error
        if (error instanceof Error && error.message.toLowerCase().includes("timeout")) {
            console.warn("[Tier2Agent] Timeout with full evidence, retrying with 50% reduced evidence...");
            // Retry with reduced evidence (take only first 50% of documents)
            const reducedEvidence = evidence.slice(0, Math.ceil(evidence.length * 0.5));
            console.log(`[Tier2Agent] Reduced evidence from ${evidence.length} to ${reducedEvidence.length} documents`);
            try {
                return await runTier2AgentInternal(baseJson, reducedEvidence, options, true);
            }
            catch (retryError) {
                // If retry also fails, throw the original error with context
                throw new Error(`Tier 2 agent failed even with reduced evidence: ${error.message}`);
            }
        }
        // If not a timeout error, rethrow
        throw error;
    }
}
/**
 * Internal implementation of Tier 2 agent
 * @param isRetry - Whether this is a retry with reduced evidence
 */
async function runTier2AgentInternal(baseJson, evidence, options = {}, isRetry = false) {
    const config = getConfig();
    // Set timeout to 4.5 minutes (270000ms) to stay under Next.js maxDuration of 5 minutes
    const API_TIMEOUT_MS = 270000;
    const openai = new OpenAI({
        apiKey: config.openAiApiKey,
        // Don't set timeout here - we'll handle it with Promise.race to have better control
    });
    // Declare token count variable for error reporting
    let totalEstimatedTokens = 0;
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

5. **Write with Depth and Detail**: 
   - ALL strategic text fields should be 2+ complete sentences minimum
   - Mission: 2-3 sentences explaining WHY the company exists
   - Vision: 3-4 sentences painting a vivid future picture
   - Pain points: ALWAYS write as first-person quotes with specific details
   - Personas: Create realistic characters (name, age, backstory)
   - Value propositions: Focus on measurable outcomes, not just features

6. **Descriptive Quality Standards**:
   
   **MISSION** - Must answer (2-3 sentences):
   • WHY does this company exist? (purpose)
   • WHAT problem are they passionate about solving?
   • WHO specifically do they serve?
   Example: "We exist to eliminate inventory chaos for growing e-commerce businesses. By automating tedious stock tracking and providing real-time insights, we empower operations teams to focus on strategic growth instead of manual spreadsheets."
   
   **VISION** - Must describe (3-4 sentences):
   • The future state when the product succeeds
   • Impact on users, industry, or world
   • Aspirational but believable
   Example: "We envision a world where every business has enterprise-grade inventory intelligence at their fingertips. A world where stockouts are predicted and prevented automatically, where supply chains are transparent and resilient, and where operations teams focus on strategy rather than firefighting crises."
   
   **PAIN POINTS** - Must be (3-5 quotes per persona):
   • First-person quotes ("I struggle with...")
   • Specific and detailed (include numbers, timeframes, specific scenarios)
   • Emotionally authentic (frustration, stress, impact)
   Bad: "Managing inventory is difficult"
   Good: "I waste 3-4 hours every Monday reconciling inventory across our warehouse spreadsheet, Shopify admin, and Amazon Seller Central. By the time I finish, the numbers are already out of date."
   
   **PERSONAS** - Must include:
   • Realistic first name + specific role (e.g., "Marcus Chen - Operations Director")
   • Age, location, company context, years of experience, education
   • Personality traits, values, work style, tech comfort level
   • 3-4 specific, measurable goals
   Example demographics: "38 years old, based in Austin, TX. Manages operations for a fast-growing DTC furniture brand ($5M ARR, team of 12). Has 7 years of e-commerce experience, started as warehouse associate and worked up to director."
   
   **VALUE PROPOSITION** - Must communicate (2-3 sentences):
   • Problem being solved (emotional hook)
   • How it's solved (mechanism)
   • Quantified benefit (numbers, time saved, cost reduced)
   Formula: [Problem solved] + [How it works] + [Quantified benefit]
   Bad: "Automated inventory management system"
   Good: "Stop losing sales to stockouts and cash to overstock. Our AI-powered platform predicts demand, automates reordering, and provides real-time visibility - saving operations teams 10+ hours per week while cutting inventory costs by 23%."

7. **The Authenticity Test**:
   Before finalizing each strategic field, ask: "Would a real company publish this on their About page or marketing site?" If it sounds like placeholder text or generic corporate jargon, rewrite with more specificity, emotion, and concrete details. Aim for authentic, compelling content that resonates with real users.

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
    // Helper function to safely call progress callback
    const updateProgress = (progress, message) => {
        try {
            if (options.onProgress) {
                options.onProgress(progress, message);
            }
        }
        catch (error) {
            // Don't let progress callback errors break the process
            console.warn("Progress callback error:", error);
        }
    };
    // Report progress when starting preparation
    const progressPrefix = isRetry ? "[Retry with reduced evidence] " : "";
    updateProgress(50, `${progressPrefix}Preparing AI analysis...`);
    // Chunk evidence to fit within token limits (Tier 2 mode for business strategy)
    updateProgress(51, "Chunking evidence documents...");
    const chunkedEvidence = chunkEvidence(evidence, MAX_EVIDENCE_TOKENS, true);
    // Build user message with context
    updateProgress(52, "Building analysis context...");
    const evidenceSummary = chunkedEvidence.map((doc) => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        contentPreview: doc.content.substring(0, 500) + (doc.content.length > 500 ? "..." : ""),
    }));
    // Create summarized version of base JSON for Tier 2 (reduces from ~13k to ~1.5k tokens)
    const baseJsonSummary = summarizeBaseJsonForTier2(baseJson);
    const baseJsonString = JSON.stringify(baseJsonSummary, null, 2);
    const baseJsonTokens = estimateTokens(baseJsonString);
    // Estimate total tokens
    const evidenceContent = chunkedEvidence.map((doc) => `\n--- ${doc.title} (${doc.type}) ---\n${doc.content}`).join("\n\n");
    const evidenceTokens = estimateTokens(evidenceContent);
    totalEstimatedTokens = baseJsonTokens + evidenceTokens + estimateTokens(systemPrompt);
    // Log token estimates for debugging
    const dataModelCount = baseJson.dataModel
        ? ('entities' in baseJson.dataModel
            ? Object.keys(baseJson.dataModel.entities || {}).length
            : Object.keys(baseJson.dataModel).length)
        : 0;
    console.log(`[Tier2Agent] Token estimates: Base JSON Summary=${baseJsonTokens}, Evidence=${evidenceTokens}, System=${estimateTokens(systemPrompt)}, Total=${totalEstimatedTokens}`);
    console.log(`[Tier2Agent] Using summarized base JSON (screens: ${baseJson.screens?.length || 0}, APIs: ${baseJson.api?.length || 0}, models: ${dataModelCount})`);
    if (totalEstimatedTokens > 100000) {
        console.warn(`[Tier2Agent] Warning: Estimated token count (${totalEstimatedTokens}) is high. This may cause timeouts.`);
    }
    if (totalEstimatedTokens > 200000) {
        console.error(`[Tier2Agent] Error: Estimated token count (${totalEstimatedTokens}) is extremely high. Request will likely timeout.`);
    }
    // Extract key insights for guidance
    const screenCount = baseJson.screens?.length || 0;
    const navCount = baseJson.navigation?.length || 0;
    const apiCount = baseJson.api?.length || 0;
    const screenNames = baseJson.screens?.slice(0, 10).map(s => s.name).join(", ") || "None";
    updateProgress(53, "Preparing AI prompt...");
    const userMessage = `# Task: Generate Comprehensive PRD from Codebase Analysis

## Technical Summary (High-Level Overview)
The following is a SUMMARY of technical data extracted from the codebase.
You'll receive detailed technical specs in Tier 3 - focus here on business strategy.

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
    // Declare progress interval and timeout outside try block for cleanup in catch
    let progressInterval = null;
    let timeoutId = null;
    try {
        // Report progress when starting the API call
        updateProgress(53, "Analyzing business strategy and target audience...");
        // Set up time-based progress estimation during API call
        // Estimate API call will take 30-60 seconds, progress from 53% to 56%
        const progressStartTime = Date.now();
        const estimatedDurationMs = 45000; // 45 seconds average
        const progressStartPercent = 53;
        const progressEndPercent = 56;
        const progressRange = progressEndPercent - progressStartPercent;
        // Start progress estimation interval (update every 2 seconds)
        if (options.onProgress) {
            progressInterval = setInterval(() => {
                const elapsed = Date.now() - progressStartTime;
                const progressRatio = Math.min(elapsed / estimatedDurationMs, 1); // Cap at 1.0
                const currentProgress = Math.round(progressStartPercent + progressRatio * progressRange);
                updateProgress(currentProgress, "Analyzing business strategy and target audience...");
            }, 2000); // Update every 2 seconds
        }
        // Wrap API call with explicit timeout to prevent hanging
        console.log(`[Tier2Agent] Starting API call with ${API_TIMEOUT_MS / 1000}s timeout...`);
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                const timeoutError = new Error(`Request timed out after ${API_TIMEOUT_MS / 1000} seconds. The analysis may be too large (estimated ${totalEstimatedTokens} tokens). Consider reducing evidence size or using a faster model.`);
                console.error(`[Tier2Agent] Timeout fired: ${timeoutError.message}`);
                reject(timeoutError);
            }, API_TIMEOUT_MS);
        });
        const apiCallStartTime = Date.now();
        const completion = await Promise.race([
            retryWithBackoff(async () => {
                console.log(`[Tier2Agent] Making OpenAI API call...`);
                const result = await openai.chat.completions.create({
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage },
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.7, // Increased for more descriptive, creative strategic content
                });
                const elapsed = Date.now() - apiCallStartTime;
                console.log(`[Tier2Agent] API call completed successfully in ${elapsed}ms`);
                return result;
            }, {
                maxRetries: 3,
                initialDelayMs: 1000,
                maxDelayMs: 30000,
                backoffMultiplier: 2,
                retryableErrors: ["429", "rate_limit", "timeout", "ECONNRESET", "ETIMEDOUT", "Request timed out"],
            }).finally(() => {
                // Clean up timeout if API call completes (success or failure)
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            }),
            timeoutPromise,
        ]);
        // Clear progress interval and timeout when API call completes
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        // Report progress after API call completes
        updateProgress(57, "Processing strategic insights...");
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
        // Report progress when merging is complete
        updateProgress(60, "Strategic analysis complete");
        return {
            updatedJson: mergedJson,
            questionsForClient: parsedResponse.questionsForClient,
        };
    }
    catch (error) {
        // Ensure progress interval and timeout are cleared on error
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        // Provide more specific error messages for timeout errors
        if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
                console.error(`[Tier2Agent] Timeout error: ${error.message}`);
                console.error(`[Tier2Agent] Estimated tokens: ${totalEstimatedTokens}`);
                throw new Error(`Tier 2 agent failed: Request timed out. The analysis may be too large (estimated ${totalEstimatedTokens} tokens). Consider reducing evidence size or using a faster model.`);
            }
            throw new Error(`Tier 2 agent failed: ${error.message}`);
        }
        throw new Error(`Tier 2 agent failed: ${String(error)}`);
    }
}
//# sourceMappingURL=tier2Agent.js.map