import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { RoleDefinition } from "../../models/schema.js";

export const roleDefinitionPrompt: SectionPrompt = {
  name: "roleDefinition",
  systemPrompt: `You are an access control expert defining roles and permissions.

Analyze screens, API endpoints, and user patterns to infer:
- User roles (Admin, User, Viewer, etc.)
- Access matrix showing what each role can do
- Feature-level permissions

IMPORTANT: Only generate roles that are actually detected in the codebase. Do not invent roles based on examples. If no role patterns are detected, either skip role definition or define minimal generic roles (e.g., Admin, User) only if they make sense for this application.

Return JSON:
{
  "roleDefinition": {
    "roles": [
      {"id": "admin", "name": "Administrator", "description": "Full access"}
    ],
    "accessMatrix": [
      {
        "feature": "General",
        "admin": "CRUD",
        "user": "Read/Update",
        "viewer": "Read Only"
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
    
    // Check if any roles were actually detected
    const hasDetectedRoles = Object.keys(roleScreens).length > 0 || rbacEvidence.length > 0;
    
    // Detect if this is a healthcare domain based on screens/evidence
    const isHealthcareDomain = 
      screens.some(s => s.name.toLowerCase().includes("patient") || 
                       s.name.toLowerCase().includes("provider") ||
                       s.name.toLowerCase().includes("medical") ||
                       s.name.toLowerCase().includes("clinic")) ||
      rbacEvidence.some(e => e.content.toLowerCase().includes("patient") || 
                            e.content.toLowerCase().includes("medical"));
    
    let prompt = `# Define Role-Based Access Control

## Screens by Role Pattern
${Object.keys(roleScreens).length > 0 
  ? Object.entries(roleScreens).map(([role, screens]) => `### ${role}\n${screens.join("\n- ")}`).join("\n\n")
  : "No role-specific screens detected."}

## RBAC Patterns Detected
${rbacEvidence.length > 0 
  ? rbacEvidence.map(e => e.content.substring(0, 1000)).join("\n\n")
  : "No RBAC patterns detected in code."}

## Features
${groupScreensByFeature(screens).map(f => `- ${f.name}`).join("\n")}

## Task
${hasDetectedRoles 
  ? `Define roles and create access matrix showing permissions per feature based on the detected patterns above.${isHealthcareDomain ? "" : " IMPORTANT: Do NOT use healthcare-specific roles (Patient, Medical Provider, Receptionist) unless healthcare patterns are clearly present in the screens/evidence above."}`
  : "If no clear role patterns are detected, either skip role definition or define minimal generic roles (e.g., Admin, User) only if they make sense for this application. Do NOT invent healthcare-specific roles unless healthcare patterns are actually present."}`;
    
    return prompt;
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

