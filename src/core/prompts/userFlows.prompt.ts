import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { CriticalUserFlow } from "../../models/schema.js";

export const userFlowsPrompt: SectionPrompt = {
  name: "userFlows",
  systemPrompt: `You are a UX expert creating critical user flows.

Generate step-by-step user flows for key journeys:
- Start from navigation structure and screen sequences
- Include user actions and system responses
- Identify pain points at each step
- Focus on critical paths (login, core feature usage, key workflows)

Return JSON:
{
  "criticalUserFlows": [
    {
      "id": "flow-1",
      "name": "Flow Name",
      "role": "User Role",
      "goal": "What user wants to achieve",
      "steps": [
        {
          "stepNumber": 1,
          "action": "User action",
          "screen": "Screen name",
          "systemResponse": "What system does",
          "painPoint": "Optional pain point"
        }
      ]
    }
  ],
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson } = context;
    
    const navigation = prdJson.navigation || [];
    const screens = prdJson.screens || [];
    
    return `# Generate Critical User Flows

## Navigation Structure
${navigation.slice(0, 20).map(n => `- ${n.fromScreenId || "-"} → ${n.toScreenId || "-"} (${n.event || n.label || "-"})`).join("\n")}

## Available Screens
${screens.map(s => `- ${s.name}`).join("\n")}

## Key Features
${prdJson.solutionOverview?.keyFeatures?.join("\n- ") || "None"}

## Task
Create 3-5 critical user flows based on navigation patterns. Include login flow and core feature workflows.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.criticalUserFlows as CriticalUserFlow[],
      questions: parsed.questions || [],
    };
  },
};

