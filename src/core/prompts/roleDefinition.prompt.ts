import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { RoleDefinition } from "../../models/schema.js";

export const roleDefinitionPrompt: SectionPrompt = {
  name: "roleDefinition",
  systemPrompt: `You are an access control expert defining roles and permissions.

Analyze screens, API endpoints, and user patterns to infer:
- User roles (Admin, Provider, Patient, etc.)
- Access matrix showing what each role can do
- Feature-level permissions

Return JSON:
{
  "roleDefinition": {
    "roles": [
      {"id": "admin", "name": "Administrator", "description": "Full access"}
    ],
    "accessMatrix": [
      {
        "feature": "Patient Registry",
        "superAdmin": "CRUD",
        "medicalProvider": "CRUD",
        "reception": "View/Edit Basic",
        "patient": "Own Profile Only"
      }
    ]
  },
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson, evidence } = context;
    
    const rbacEvidence = evidence.filter(e => e.type === "code_patterns");
    const screens = prdJson.screens || [];
    
    // Extract roles from screen names
    const roleScreens: Record<string, string[]> = {};
    screens.forEach(screen => {
      const name = screen.name.toLowerCase();
      if (name.includes("admin")) {
        if (!roleScreens["Admin"]) roleScreens["Admin"] = [];
        roleScreens["Admin"].push(screen.name);
      }
      if (name.includes("patient")) {
        if (!roleScreens["Patient"]) roleScreens["Patient"] = [];
        roleScreens["Patient"].push(screen.name);
      }
      if (name.includes("provider") || name.includes("doctor") || name.includes("nurse")) {
        if (!roleScreens["Provider"]) roleScreens["Provider"] = [];
        roleScreens["Provider"].push(screen.name);
      }
    });
    
    return `# Define Role-Based Access Control

## Screens by Role Pattern
${Object.entries(roleScreens).map(([role, screens]) => `### ${role}\n${screens.join("\n- ")}`).join("\n\n")}

## RBAC Patterns Detected
${rbacEvidence.map(e => e.content.substring(0, 1000)).join("\n\n")}

## Features
${groupScreensByFeature(screens).map(f => `- ${f.name}`).join("\n")}

## Task
Define roles and create access matrix showing permissions per feature.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.roleDefinition as RoleDefinition,
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
    if (!groups[feature]) groups[feature] = [];
    groups[feature].push(screen.name);
  });
  return Object.entries(groups).map(([name, screens]) => ({ name, screens }));
}

