import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { RiskManagement, Risk, PrdJson } from "../../models/schema.js";

export const riskManagementPrompt: SectionPrompt = {
  name: "riskManagement",
  systemPrompt: `You are a risk management expert analyzing product requirements and technical architecture.

Identify risks across four categories:
1. **Operational**: User adoption, workflow complexity, training needs, process changes
2. **Technical**: Dependencies, architecture, scalability, performance, downtime
3. **Security**: Data breaches, unauthorized access, compliance violations
4. **Legal**: Regulatory compliance, data residency, consent validity

For each risk, provide:
- Description
- Category
- Probability (low/medium/high)
- Impact (low/medium/high/critical)
- Mitigation strategy

Return JSON:
{
  "risks": [
    {
      "id": "risk-1",
      "description": "Risk description",
      "category": "operational",
      "probability": "medium",
      "impact": "high",
      "mitigationStrategy": "How to mitigate"
    }
  ],
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;
    
    return `# Risk Management Analysis

## Project Context
- **Project**: ${prdJson.project?.name || "Unknown"}
- **Domain**: ${inferDomain(prdJson, evidence)}
- **Complexity**: ${prdJson.screens?.length || 0} screens, ${prdJson.api?.length || 0} APIs

## Features & Workflows
${prdJson.screens?.slice(0, 15).map(s => `- ${s.name}`).join("\n") || "None"}

## Dependencies
${evidence.filter(e => e.type === "config_file" || e.type === "package_metadata").map(e => e.content.substring(0, 500)).join("\n\n")}

## Task
Identify realistic risks based on the project complexity, domain, and dependencies. Consider:
- Operational risks from workflow changes
- Technical risks from dependencies and architecture
- Security risks from data handling and auth patterns
- Legal risks from domain and compliance requirements`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: { risks: parsed.risks } as RiskManagement,
      questions: parsed.questions || [],
    };
  },
};

function inferDomain(prdJson: PrdJson, evidence: any[]): string {
    const screenNames = prdJson.screens?.map((s: any) => s.name.toLowerCase()).join(" ") || "";
  if (screenNames.includes("patient") || screenNames.includes("clinic")) return "Healthcare";
  if (screenNames.includes("order") || screenNames.includes("cart")) return "E-commerce";
  return "General";
}

