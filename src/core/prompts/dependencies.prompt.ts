import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { Dependencies } from "../../models/schema.js";

export const dependenciesPrompt: SectionPrompt = {
  name: "dependencies",
  systemPrompt: `You are an expert product analyst identifying dependencies from codebases and project evidence.

Your task is to identify three types of dependencies:

1. **Service Dependencies**: External services, APIs, third-party libraries that the product relies on
2. **Operational Dependencies**: Clinic/staff requirements, hardware, training, data preparation
3. **Content Dependencies**: Translations, legal documents, template content, documentation needs

## Guidelines:
- Extract service dependencies from package.json, config files, API integrations
- Infer operational dependencies from user roles, workflow complexity, feature requirements
- Identify content needs from i18n patterns, legal requirements, documentation gaps

Return JSON:
{
  "dependencies": {
    "service": [
      {"name": "Service Name", "description": "What it provides", "impact": "What happens if it fails"}
    ],
    "operational": [
      {"description": "Dependency description", "requirement": "What's needed"}
    ],
    "content": [
      {"description": "Content needed", "source": "Where it comes from"}
    ]
  },
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;
    
    const configEvidence = evidence.filter(e => e.type === "config_file");
    const packageEvidence = evidence.filter(e => e.type === "package_metadata");
    const apiEndpoints = prdJson.api || [];
    
    let prompt = `# Generate Dependencies Analysis

## Project Context
- **Project**: ${prdJson.project?.name || "Unknown"}
- **API Endpoints**: ${apiEndpoints.length}
- **Screens**: ${prdJson.screens?.length || 0}

## Evidence

### Package Dependencies
${packageEvidence.map(e => e.content.substring(0, 1500)).join("\n\n")}

### Configuration Files
${configEvidence.map(e => e.content.substring(0, 1000)).join("\n\n")}

### API Endpoints
${apiEndpoints.slice(0, 10).map(e => `- ${e.method} ${e.endpoint}`).join("\n")}

### User Roles
${extractRoles(prdJson)}

## Task
Identify all dependencies across the three categories. Be specific about what external services are used and what operational requirements exist.`;

    return prompt;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.dependencies as Dependencies,
      questions: parsed.questions || [],
    };
  },
};

function extractRoles(prdJson: PrdJson): string {
  const roles: string[] = [];
  prdJson.screens?.forEach(screen => {
    const name = screen.name.toLowerCase();
    if (name.includes("admin") && !roles.includes("Admin")) roles.push("Admin");
    if (name.includes("patient") && !roles.includes("Patient")) roles.push("Patient");
    if (name.includes("provider") && !roles.includes("Provider")) roles.push("Provider");
  });
  return roles.length > 0 ? roles.join(", ") : "Unknown";
}

