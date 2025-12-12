import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { DependencyMappingEntry } from "../../models/schema.js";

export const dependencyMappingPrompt: SectionPrompt = {
  name: "dependencyMapping",
  systemPrompt: `You are a senior product + engineering analyst.

Your task: produce a dependency mapping table for the PRD.

Rules:
- Use evidence from code, config, tests, and any detected contracts/schemas to infer dependencies.
- Be explicit and specific (e.g., "Auth provider (OAuth/SSO)", "Email service (transactional)", "File storage (S3)", "Payments (Stripe)").
- If something is uncertain, still include it but mark it as inferred in the description.
- Do NOT invent brand/vendor names unless evidence suggests them (e.g., if Stripe is present in deps/config).

Return JSON:
{
  "dependencyMapping": [
    {
      "featureArea": "Feature area / module name",
      "dependsOn": ["Dependency name"],
      "description": "Why this dependency is required for this feature area"
    }
  ],
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;

    const keyEvidence = evidence
      .filter((e) => ["package_metadata", "config_file", "test_file", "code_patterns", "contracts", "repo_docs", "repo_readme"].includes(e.type))
      .slice(0, 8)
      .map((e) => `--- ${e.title} (${e.type}) ---\n${e.content.substring(0, 2000)}`)
      .join("\n\n");

    const featureAreas = (prdJson.productRequirements || []).map((r) => r.module).slice(0, 20);
    const services = (prdJson.dependencies as any)?.service?.map((d: any) => d.name).slice(0, 20) || [];

    return `# Build Dependency Mapping

## Feature Areas
${featureAreas.length ? featureAreas.map((f) => `- ${f}`).join("\n") : "None detected"}

## Known/Detected Dependencies (if any)
${services.length ? services.map((s: string) => `- ${s}`).join("\n") : "None detected"}

## Evidence
${keyEvidence || "None"}

## Task
Create a dependency mapping that ties each feature area to the dependencies that block or enable it.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: (parsed.dependencyMapping || []) as DependencyMappingEntry[],
      questions: parsed.questions || [],
    };
  },
};

