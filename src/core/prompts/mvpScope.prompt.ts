import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { MvpScope, MvpFeature } from "../../models/schema.js";

export const mvpScopePrompt: SectionPrompt = {
  name: "mvpScope",
  systemPrompt: `You are a product strategist defining MVP scope.

Prioritize features based on:
- Core user value (must-have vs nice-to-have)
- Dependencies (features that block others)
- Complexity (simple vs complex implementations)
- User roles (which roles need which features)

Return JSON:
{
  "mvpScope": {
    "phase": "Phase 1 / MVP",
    "inScope": ["High-level in-scope items (optional)", "..."],
    "features": [
      {
        "name": "Feature Name",
        "description": "What it does",
        "priority": "high",
        "screens": ["Screen1", "Screen2"],
        "dependencies": ["Feature X"]
      }
    ],
    "outOfScope": ["Feature not in MVP", ...]
    ,
    "roleStages": [
      {
        "role": "Role name",
        "stages": [
          { "name": "Stage name", "items": ["Capability/step", "..."] }
        ]
      }
    ]
  },
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson } = context;
    
    const features = groupScreensByFeature(prdJson.screens || []);
    const roles = prdJson.roleDefinition?.roles?.map(r => r.name) || [];
    
    return `# Define MVP Scope

## All Features Detected
${features.map(f => `### ${f.name}\nScreens: ${f.screens.join(", ")}`).join("\n\n")}

## Key Features from Solution
${prdJson.solutionOverview?.keyFeatures?.join("\n- ") || "None"}

## Roles Detected
${roles.length ? roles.map(r => `- ${r}`).join("\n") : "None"}

## Task
Prioritize features for MVP. Include:
- A high-level in-scope list (inScope)
- A structured feature list with priority/dependencies
- Optional role/stage breakdown (roleStages) if roles can be inferred
- An explicit out-of-scope list`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.mvpScope as MvpScope,
      questions: parsed.questions || [],
    };
  },
};

function groupScreensByFeature(screens: any[]): Array<{ name: string; screens: string[] }> {
  const groups: Record<string, string[]> = {};
  screens.forEach(screen => {
    let feature = "General";
    const name = screen.name.toLowerCase();
    if (name.includes("patient")) feature = "Patient Management";
    else if (name.includes("inventory")) feature = "Inventory";
    else if (name.includes("schedule")) feature = "Scheduling";
    else if (name.includes("dashboard")) feature = "Dashboard";
    if (!groups[feature]) groups[feature] = [];
    groups[feature].push(screen.name);
  });
  return Object.entries(groups).map(([name, screens]) => ({ name, screens }));
}

