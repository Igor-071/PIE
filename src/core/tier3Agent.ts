import { PrdJson, QuestionsForClient } from "../models/schema.js";
import { EvidenceDocument } from "./evidenceCollector.js";
import { executePrompts, PromptContext } from "./prompts/promptTemplate.js";
import { assumptionsPrompt } from "./prompts/assumptions.prompt.js";
import { dependenciesPrompt } from "./prompts/dependencies.prompt.js";
import { riskManagementPrompt } from "./prompts/riskManagement.prompt.js";
import { goalsAndSuccessCriteriaPrompt } from "./prompts/goalsAndSuccessCriteria.prompt.js";
import { acceptanceCriteriaPrompt } from "./prompts/acceptanceCriteria.prompt.js";
import { mvpScopePrompt } from "./prompts/mvpScope.prompt.js";
import { roleDefinitionPrompt } from "./prompts/roleDefinition.prompt.js";
import { userFlowsPrompt } from "./prompts/userFlows.prompt.js";
import { technicalRequirementsPrompt } from "./prompts/technicalRequirements.prompt.js";
import { nonFunctionalRequirementsPrompt } from "./prompts/nonFunctionalRequirements.prompt.js";
import { openQuestionsPrompt } from "./prompts/openQuestions.prompt.js";

export interface Tier3AgentOptions {
  model?: string;
  temperature?: number;
  skipSections?: string[]; // Optional: skip certain sections
}

/**
 * Tier 3 Agent: Generates advanced PRD sections using specialized prompts
 * 
 * This agent runs after Tier 2 and generates:
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
}> {
  const context: PromptContext = {
    prdJson,
    evidence,
    tier1Data,
  };

  // Define all prompts to execute
  const allPrompts = [
    goalsAndSuccessCriteriaPrompt,
    mvpScopePrompt,
    assumptionsPrompt,
    dependenciesPrompt,
    roleDefinitionPrompt,
    acceptanceCriteriaPrompt,
    userFlowsPrompt,
    technicalRequirementsPrompt,
    nonFunctionalRequirementsPrompt,
    riskManagementPrompt,
    openQuestionsPrompt,
  ];

  // Filter out skipped sections
  const promptsToExecute = options.skipSections
    ? allPrompts.filter(p => !options.skipSections!.includes(p.name))
    : allPrompts;

  console.log(`Executing ${promptsToExecute.length} Tier 3 prompts...`);

  // Execute all prompts
  const results = await executePrompts(promptsToExecute, context, {
    model: options.model,
    temperature: options.temperature,
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

  if (results.openQuestions?.sectionData) {
    updatedJson.openQuestions = results.openQuestions.sectionData;
  }

  // Collect all questions from all prompts
  const allQuestions: QuestionsForClient["questions"] = [];
  Object.values(results).forEach(result => {
    if (result.questions) {
      allQuestions.push(...result.questions);
    }
  });

  return {
    updatedJson,
    questions: {
      questions: allQuestions,
      generatedAt: new Date().toISOString(),
    },
  };
}

