import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { TechnicalRequirement } from "../../models/schema.js";

export const technicalRequirementsPrompt: SectionPrompt = {
  name: "technicalRequirements",
  systemPrompt: `You are a technical architect defining infrastructure and architecture requirements.

Generate requirements in four categories:
1. **Infrastructure**: Hosting, servers, CDN, regions
2. **Architecture**: Frontend/backend stack, state management, API design
3. **Data Management**: Database, storage, backups, data residency
4. **Integration**: Third-party services, APIs, webhooks

Base on config files, dependencies, and detected patterns.

Return JSON:
{
  "technicalRequirements": [
    {
      "category": "infrastructure",
      "requirements": ["Requirement 1", "Requirement 2"],
      "details": {"key": "value"}
    }
  ],
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;
    
    const configEvidence = evidence.filter(e => e.type === "config_file");
    const packageEvidence = evidence.filter(e => e.type === "package_metadata");
    
    return `# Generate Technical Requirements

## Tech Stack Detected
${prdJson.aiMetadata?.stackDetected?.join(", ") || "Unknown"}

## Configuration Files
${configEvidence.map(e => e.content.substring(0, 1500)).join("\n\n")}

## Package Dependencies
${packageEvidence.map(e => e.content.substring(0, 1500)).join("\n\n")}

## Data Models
${Object.keys(prdJson.dataModel || {}).join(", ") || "None"}

## Task
Generate technical requirements across all four categories based on detected stack and patterns.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.technicalRequirements as TechnicalRequirement[],
      questions: parsed.questions || [],
    };
  },
};

