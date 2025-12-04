import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { Assumptions, PrdJson } from "../../models/schema.js";

export const assumptionsPrompt: SectionPrompt = {
  name: "assumptions",
  systemPrompt: `You are an expert product analyst specializing in identifying assumptions from technical codebases and project evidence.

Your task is to analyze the provided codebase, configuration files, dependencies, and evidence to generate realistic assumptions across four categories:

1. **Technical Assumptions**: Infrastructure, hosting, database, third-party services, connectivity requirements
2. **Operational Assumptions**: Workflow patterns, user adoption, training needs, hardware requirements
3. **Financial Assumptions**: Third-party service costs, hosting costs, operational expenses
4. **Legal/Compliance Assumptions**: Data residency, regulatory requirements (GDPR, HIPAA, etc.), compliance needs

## Guidelines:
- Base assumptions on actual evidence found (config files, dependencies, domain patterns)
- Be specific and realistic
- Infer from patterns (e.g., healthcare domain → HIPAA, EU hosting → GDPR)
- Include assumptions about third-party services detected
- Consider operational workflows inferred from screen patterns and user roles

Return JSON with this structure:
{
  "assumptions": {
    "technical": ["assumption 1", "assumption 2", ...],
    "operational": ["assumption 1", ...],
    "financial": ["assumption 1", ...],
    "legal": ["assumption 1", ...]
  },
  "questions": [
    {
      "field": "assumptions.technical",
      "question": "What is the expected internet connectivity requirement?",
      "reason": "Not explicitly stated in evidence",
      "priority": "medium"
    }
  ]
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;
    
    // Extract relevant evidence
    const configEvidence = evidence.filter(e => e.type === "config_file");
    const packageEvidence = evidence.filter(e => e.type === "package_metadata");
    const codePatterns = evidence.filter(e => e.type === "code_patterns");
    
    let prompt = `# Generate Assumptions for PRD

## Project Context
- **Project Name**: ${prdJson.project?.name || "Unknown"}
- **Domain**: ${inferDomain(prdJson, evidence)}
- **Tech Stack**: ${prdJson.aiMetadata?.stackDetected?.join(", ") || "Unknown"}

## Evidence Available

### Configuration Files (${configEvidence.length})
${configEvidence.map(e => `\n### ${e.title}\n${e.content.substring(0, 1000)}`).join("\n")}

### Package Metadata (${packageEvidence.length})
${packageEvidence.map(e => `\n### ${e.title}\n${e.content.substring(0, 1000)}`).join("\n")}

### Code Patterns (${codePatterns.length})
${codePatterns.map(e => `\n### ${e.title}\n${e.content.substring(0, 1000)}`).join("\n")}

### Screens & Features
${prdJson.screens?.slice(0, 10).map(s => `- ${s.name}`).join("\n") || "None"}

### User Roles Detected
${extractRoles(prdJson)}

## Analysis Task

Based on the evidence above, generate realistic assumptions in all four categories. Be specific and code-informed.`;


    return prompt;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.assumptions as Assumptions,
      questions: parsed.questions || [],
    };
  },
};

function inferDomain(prdJson: PrdJson, evidence: any[]): string {
  // Infer domain from screens, data models, or evidence
    const screenNames = prdJson.screens?.map((s: any) => s.name.toLowerCase()).join(" ") || "";
  
  if (screenNames.includes("patient") || screenNames.includes("clinic") || screenNames.includes("medical")) {
    return "Healthcare/Medical";
  }
  if (screenNames.includes("order") || screenNames.includes("cart") || screenNames.includes("product")) {
    return "E-commerce";
  }
  if (screenNames.includes("payment") || screenNames.includes("transaction")) {
    return "Fintech";
  }
  
  return "General";
}

function extractRoles(prdJson: PrdJson): string {
  const roles: string[] = [];
  
      prdJson.screens?.forEach((screen: any) => {
    const name = screen.name.toLowerCase();
    if (name.includes("admin") && !roles.includes("Admin")) roles.push("Admin");
    if (name.includes("patient") && !roles.includes("Patient")) roles.push("Patient");
    if (name.includes("provider") && !roles.includes("Provider")) roles.push("Provider");
    if (name.includes("doctor") && !roles.includes("Doctor")) roles.push("Doctor");
    if (name.includes("nurse") && !roles.includes("Nurse")) roles.push("Nurse");
  });
  
  return roles.length > 0 ? roles.join(", ") : "Unknown";
}

