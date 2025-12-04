import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { NonFunctionalRequirement, PrdJson } from "../../models/schema.js";

export const nonFunctionalRequirementsPrompt: SectionPrompt = {
  name: "nonFunctionalRequirements",
  systemPrompt: `You are a quality assurance expert defining non-functional requirements.

Generate NFRs in categories:
1. **Performance**: Load times, response times, throughput
2. **Security**: Authentication, encryption, compliance, data protection
3. **Usability**: Accessibility, mobile responsiveness, language support
4. **Reliability**: Uptime, error handling, backup/recovery
5. **Scalability**: User capacity, data growth, concurrent users

Return JSON:
{
  "nonFunctionalRequirements": [
    {
      "category": "performance",
      "requirements": ["Requirement 1", ...],
      "metrics": {"loadTime": "<1.5s", "responseTime": "<200ms"}
    }
  ],
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;
    
    return `# Generate Non-Functional Requirements

## Project Context
- **Domain**: ${inferDomain(prdJson)}
- **Screens**: ${prdJson.screens?.length || 0}
- **APIs**: ${prdJson.api?.length || 0}

## Domain-Specific Needs
${prdJson.problemDefinition?.primaryProblem || "General application"}

## Task
Generate realistic NFRs with specific metrics. Consider domain requirements (healthcare → HIPAA, EU → GDPR).`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.nonFunctionalRequirements as NonFunctionalRequirement[],
      questions: parsed.questions || [],
    };
  },
};

function inferDomain(prdJson: PrdJson): string {
    const screenNames = prdJson.screens?.map((s: any) => s.name.toLowerCase()).join(" ") || "";
  if (screenNames.includes("patient") || screenNames.includes("clinic")) return "Healthcare";
  return "General";
}

