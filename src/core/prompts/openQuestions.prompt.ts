import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { OpenQuestions } from "../../models/schema.js";

export const openQuestionsPrompt: SectionPrompt = {
  name: "openQuestions",
  systemPrompt: `You are a product analyst identifying gaps and open questions.

Identify questions that need client/stakeholder input:
- Missing information that couldn't be inferred
- Decisions that require business input
- Assumptions that need validation
- Technical choices that need confirmation

Categorize as: client, technical, operational, legal

Return JSON:
{
  "openQuestions": {
    "questions": [
      {
        "id": "q-1",
        "question": "What is the expected user volume?",
        "category": "client",
        "priority": "high",
        "context": "Needed for infrastructure sizing"
      }
    ],
    "decisions": []
  },
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;
    
    // Identify gaps
    const hasAssumptions = !!prdJson.assumptions;
    const hasDependencies = !!prdJson.dependencies;
    const hasTechnicalReqs = !!prdJson.technicalRequirements;
    
    return `# Identify Open Questions

## Current PRD State
- Assumptions defined: ${hasAssumptions}
- Dependencies identified: ${hasDependencies}
- Technical requirements: ${hasTechnicalReqs}

## Evidence Gaps
${evidence.length === 0 ? "Limited evidence available" : `${evidence.length} evidence documents`}

## Task
Identify critical questions requiring client/stakeholder input. Focus on:
- Business decisions
- Missing technical specifications
- Operational requirements
- Legal/compliance clarifications`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.openQuestions as OpenQuestions,
      questions: parsed.questions || [],
    };
  },
};

