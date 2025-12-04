import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { GoalsAndSuccessCriteria, SuccessMetric, PrdJson } from "../../models/schema.js";

export const goalsAndSuccessCriteriaPrompt: SectionPrompt = {
  name: "goalsAndSuccessCriteria",
  systemPrompt: `You are a product strategy expert defining goals and success criteria.

Generate:
1. **Primary Goals**: 3-5 high-level objectives the product aims to achieve
2. **Success Metrics**: Specific, measurable KPIs with targets and measurement methods
3. **KPIs**: Key performance indicators as simple list items

Base goals on:
- Problem statements and user pain points
- Features and capabilities detected
- Domain-specific success patterns (e.g., healthcare → patient satisfaction, inventory → waste reduction)

Return JSON:
{
  "goalsAndSuccessCriteria": {
    "primaryGoals": ["Goal 1", "Goal 2", ...],
    "successMetrics": [
      {
        "name": "Metric Name",
        "description": "What it measures",
        "target": "Target value",
        "measurementMethod": "How to measure"
      }
    ],
    "kpis": ["KPI 1", "KPI 2", ...]
  },
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson } = context;
    
    return `# Generate Goals & Success Criteria

## Problem Statement
${prdJson.problemDefinition?.primaryProblem || "Not specified"}

## Solution Overview
${prdJson.solutionOverview?.valueProposition || "Not specified"}

## Key Features
${prdJson.solutionOverview?.keyFeatures?.join("\n- ") || "None"}

## User Pain Points
${prdJson.problemDefinition?.userPainPoints?.join("\n- ") || "None"}

## Domain
${inferDomain(prdJson)}

## Task
Generate primary goals and specific, measurable success metrics. Make KPIs realistic and domain-appropriate.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.goalsAndSuccessCriteria as GoalsAndSuccessCriteria,
      questions: parsed.questions || [],
    };
  },
};

function inferDomain(prdJson: PrdJson): string {
    const screenNames = prdJson.screens?.map((s: any) => s.name.toLowerCase()).join(" ") || "";
  if (screenNames.includes("patient") || screenNames.includes("clinic")) return "Healthcare";
  if (screenNames.includes("inventory")) return "Inventory Management";
  return "General";
}

