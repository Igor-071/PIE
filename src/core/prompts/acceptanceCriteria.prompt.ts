import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { ProductRequirement } from "../../models/schema.js";

export const acceptanceCriteriaPrompt: SectionPrompt = {
  name: "acceptanceCriteria",
  systemPrompt: `You are a product requirements expert generating detailed acceptance criteria.

Analyze features/modules and create:
- Module name and objective
- Feature breakdown with specific acceptance criteria
- Testable, specific criteria (not vague statements)

Use test files, component props, and API contracts to inform criteria.

Return JSON:
{
  "productRequirements": [
    {
      "module": "Module Name",
      "objective": "What this module achieves",
      "features": [
        {
          "name": "Feature Name",
          "description": "Feature description",
          "acceptanceCriteria": [
            {
              "id": "ac-1",
              "description": "Specific, testable criterion",
              "testable": true
            }
          ]
        }
      ]
    }
  ],
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;
    
    const testEvidence = evidence.filter(e => e.type === "test_file");
    const componentEvidence = evidence.filter(e => e.type === "component_analysis");
    
    // Group screens by feature area
    const features = groupScreensByFeature(prdJson.screens || []);
    
    return `# Generate Acceptance Criteria

## Features/Modules Detected
${features.map(f => `### ${f.name}\nScreens: ${f.screens.join(", ")}`).join("\n\n")}

## Test Files Analysis
${testEvidence.map(e => e.content.substring(0, 1000)).join("\n\n")}

## Component Analysis
${componentEvidence.map(e => e.content.substring(0, 1000)).join("\n\n")}

## API Endpoints
${prdJson.api?.slice(0, 10).map(e => `- ${e.method} ${e.endpoint}`).join("\n") || "None"}

## Task
Generate detailed acceptance criteria for each feature/module. Make criteria specific and testable.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.productRequirements as ProductRequirement[],
      questions: parsed.questions || [],
    };
  },
};

function groupScreensByFeature(screens: any[]): Array<{ name: string; screens: string[] }> {
  const groups: Record<string, string[]> = {};
  
  screens.forEach(screen => {
    let feature = "General";
    const name = screen.name.toLowerCase();
    const path = screen.path?.toLowerCase() || "";
    
    if (name.includes("patient") || path.includes("patient")) feature = "Patient Management";
    else if (name.includes("inventory") || path.includes("inventory")) feature = "Inventory Management";
    else if (name.includes("schedule") || path.includes("schedule") || name.includes("appointment")) feature = "Scheduling";
    else if (name.includes("dashboard")) feature = "Dashboard";
    else if (name.includes("auth") || name.includes("login")) feature = "Authentication";
    else if (name.includes("admin") || path.includes("admin")) feature = "Administration";
    else if (name.includes("report")) feature = "Reporting";
    else if (name.includes("setting")) feature = "Settings";
    
    if (!groups[feature]) groups[feature] = [];
    groups[feature].push(screen.name);
  });
  
  return Object.entries(groups).map(([name, screens]) => ({ name, screens }));
}

