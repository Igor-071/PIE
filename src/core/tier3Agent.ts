import { PrdJson, QuestionsForClient } from "../models/schema.js";
import { EvidenceDocument } from "./evidenceCollector.js";
import { executePrompts, PromptContext } from "./prompts/promptTemplate.js";
import { TokenUsage } from "./tokenTracker.js";
import { assumptionsPrompt } from "./prompts/assumptions.prompt.js";
import { dependenciesPrompt } from "./prompts/dependencies.prompt.js";
import { dependencyMappingPrompt } from "./prompts/dependencyMapping.prompt.js";
import { riskManagementPrompt } from "./prompts/riskManagement.prompt.js";
import { goalsAndSuccessCriteriaPrompt } from "./prompts/goalsAndSuccessCriteria.prompt.js";
import { acceptanceCriteriaPrompt } from "./prompts/acceptanceCriteria.prompt.js";
import { mvpScopePrompt } from "./prompts/mvpScope.prompt.js";
import { roleDefinitionPrompt } from "./prompts/roleDefinition.prompt.js";
import { userFlowsPrompt } from "./prompts/userFlows.prompt.js";
import { technicalRequirementsPrompt } from "./prompts/technicalRequirements.prompt.js";
import { nonFunctionalRequirementsPrompt } from "./prompts/nonFunctionalRequirements.prompt.js";
import { openQuestionsPrompt } from "./prompts/openQuestions.prompt.js";
import { executiveSummaryPrompt } from "./prompts/executiveSummary.prompt.js";
import { competitiveIntelligencePrompt } from "./prompts/competitiveIntelligence.prompt.js";
import { implementationRoadmapPrompt } from "./prompts/implementationRoadmap.prompt.js";

export interface Tier3AgentOptions {
  model?: string;
  temperature?: number;
  skipSections?: string[]; // Optional: skip certain sections
  onProgress?: (progress: number, message: string) => void; // Progress callback: progress (0-100), message
}

/**
 * Tier 3 Agent: Generates advanced PRD sections using specialized prompts
 * 
 * This agent runs after Tier 2 and generates:
 * - Executive Summary (NEW - Phase 1)
 * - Goals & Success Criteria
 * - MVP Scope
 * - Assumptions
 * - Dependencies
 * - Role Definition / Access Model
 * - Product Requirements / Acceptance Criteria
 * - Critical User Flows
 * - Technical Requirements
 * - Non-Functional Requirements
 * - Risk Management
 * - Competitive Intelligence (NEW - Phase 1)
 * - Implementation Roadmap (NEW - Phase 1)
 * - Open Questions & Decisions
 */
export async function runTier3Agent(
  prdJson: PrdJson,
  evidence: EvidenceDocument[],
  tier1Data: any,
  options: Tier3AgentOptions = {}
): Promise<{
  updatedJson: PrdJson;
  questions: QuestionsForClient;
  tokenUsage?: TokenUsage;
}> {
  const context: PromptContext = {
    prdJson,
    evidence,
    tier1Data,
  };

  // Define all prompts to execute
  // Note: Executive summary runs first but synthesizes all sections,
  // so it will reference what exists from Tier 2
  const allPrompts = [
    goalsAndSuccessCriteriaPrompt,
    mvpScopePrompt,
    assumptionsPrompt,
    dependenciesPrompt,
    dependencyMappingPrompt,
    roleDefinitionPrompt,
    acceptanceCriteriaPrompt,
    userFlowsPrompt,
    technicalRequirementsPrompt,
    nonFunctionalRequirementsPrompt,
    riskManagementPrompt,
    competitiveIntelligencePrompt, // NEW - Phase 1
    implementationRoadmapPrompt,   // NEW - Phase 1
    openQuestionsPrompt,
    executiveSummaryPrompt,        // NEW - Phase 1 (runs last to synthesize everything)
  ];

  // Filter out skipped sections
  const promptsToExecute = options.skipSections
    ? allPrompts.filter(p => !options.skipSections!.includes(p.name))
    : allPrompts;

  console.log(`Executing ${promptsToExecute.length} Tier 3 prompts...`);

  // Helper function to convert camelCase prompt names to readable format
  const formatPromptName = (name: string): string => {
    // Convert camelCase to Title Case with spaces
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Create progress callback that maps prompt progress (0-1) to overall Tier 3 progress (70-90%)
  const promptProgressCallback = options.onProgress
    ? (completed: number, total: number, currentPromptName: string) => {
        // Map prompt progress to Tier 3 progress range (70% to 90%)
        const promptProgress = completed / total;
        const tier3Progress = 70 + promptProgress * 20; // 70% to 90%
        const formattedName = formatPromptName(currentPromptName);
        const message = `Generating ${formattedName} (${completed}/${total})...`;
        options.onProgress!(Math.round(tier3Progress), message);
      }
    : undefined;

  // Execute all prompts
  const results = await executePrompts(promptsToExecute, context, {
    model: options.model,
    temperature: options.temperature,
    onProgress: promptProgressCallback,
  });

  // Merge results into PRD JSON
  const updatedJson: PrdJson = { ...prdJson };

  // Merge each section's data
  if (results.goalsAndSuccessCriteria?.sectionData) {
    updatedJson.goalsAndSuccessCriteria = results.goalsAndSuccessCriteria.sectionData;
  }

  if (results.mvpScope?.sectionData) {
    updatedJson.mvpScope = results.mvpScope.sectionData;
  }

  if (results.assumptions?.sectionData) {
    updatedJson.assumptions = results.assumptions.sectionData;
  }

  if (results.dependencies?.sectionData) {
    updatedJson.dependencies = results.dependencies.sectionData;
  }

  if (results.dependencyMapping?.sectionData) {
    updatedJson.dependencyMapping = results.dependencyMapping.sectionData;
  }

  if (results.roleDefinition?.sectionData) {
    updatedJson.roleDefinition = results.roleDefinition.sectionData;
  }

  if (results.acceptanceCriteria?.sectionData) {
    updatedJson.productRequirements = results.acceptanceCriteria.sectionData;
  }

  if (results.userFlows?.sectionData) {
    updatedJson.criticalUserFlows = results.userFlows.sectionData;
  }

  if (results.technicalRequirements?.sectionData) {
    updatedJson.technicalRequirements = results.technicalRequirements.sectionData;
  }

  if (results.nonFunctionalRequirements?.sectionData) {
    updatedJson.nonFunctionalRequirements = results.nonFunctionalRequirements.sectionData;
  }

  if (results.riskManagement?.sectionData) {
    updatedJson.riskManagement = results.riskManagement.sectionData;
  }

  // NEW - Phase 1 sections
  if (results.competitiveIntelligence?.sectionData) {
    updatedJson.competitiveAnalysis = results.competitiveIntelligence.sectionData;
  }

  if (results.implementationRoadmap?.sectionData) {
    updatedJson.deliveryTimeline = results.implementationRoadmap.sectionData;
  }

  if (results.executiveSummary?.sectionData) {
    updatedJson.executiveSummary = results.executiveSummary.sectionData;
  }

  if (results.openQuestions?.sectionData) {
    updatedJson.openQuestions = results.openQuestions.sectionData;
  }

  // Collect all questions from all prompts
  const allQuestions: QuestionsForClient["questions"] = [];
  
  // Aggregate token usage from all prompts
  let totalTokenUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  Object.values(results).forEach(result => {
    if (result.questions) {
      allQuestions.push(...result.questions);
    }
    if (result.tokenUsage) {
      totalTokenUsage.promptTokens += result.tokenUsage.promptTokens;
      totalTokenUsage.completionTokens += result.tokenUsage.completionTokens;
      totalTokenUsage.totalTokens += result.tokenUsage.totalTokens;
    }
  });

  if (totalTokenUsage.totalTokens > 0) {
    console.log(`[Tier3Agent] Total token usage: ${totalTokenUsage.totalTokens} tokens (${totalTokenUsage.promptTokens} prompt + ${totalTokenUsage.completionTokens} completion)`);
  }

  return {
    updatedJson,
    questions: {
      questions: allQuestions,
      generatedAt: new Date().toISOString(),
    },
    tokenUsage: totalTokenUsage.totalTokens > 0 ? totalTokenUsage : undefined,
  };
}

