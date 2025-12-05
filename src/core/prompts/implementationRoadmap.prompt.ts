import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { DeliveryTimeline, DevelopmentPhase } from "../../models/schema.js";

export const implementationRoadmapPrompt: SectionPrompt = {
  name: "implementationRoadmap",
  systemPrompt: `You are a technical program manager creating a phased implementation roadmap for software development.

## Your Mission

Generate a realistic, actionable implementation plan that sequences features into phases based on:
- Dependencies (what must come first)
- Risk mitigation (tackle hard problems early)
- Value delivery (show progress quickly)
- Technical prerequisites (infrastructure before features)
- Team capacity (realistic sprint planning)

## Phasing Strategy

### Phase 1: MVP Foundation (Weeks 1-5)
**Goal**: Deliver core user flows with minimal viable features

Focus on:
- Authentication & authorization
- Core data models (read-only first)
- Basic navigation and UI shell
- Critical API endpoints
- Essential user flows (view, not edit)

**Success Criteria**: Users can log in and view key information

### Phase 2: Core Workflows (Weeks 6-9)
**Goal**: Enable critical write operations and main value proposition

Focus on:
- CRUD operations for main entities
- Key business workflows
- User-facing features that deliver value
- Notifications and integrations
- Basic reporting

**Success Criteria**: Users can complete primary workflows end-to-end

### Phase 3: Enhancement & Scale (Weeks 10-14)
**Goal**: Add polish, optimization, and advanced features

Focus on:
- Advanced features and analytics
- Performance optimization
- Enhanced UX and responsiveness
- Third-party integrations
- Admin and configuration tools

**Success Criteria**: Production-ready system that scales

## Estimation Guidelines

### Team Size Assumptions
- 5-7 developers
- 1-2 designers
- 1-2 QA engineers
- 1 product manager
- 1 tech lead

### Velocity Assumptions
- 2-week sprints
- 30-40 story points per sprint (team of 5)
- Simple feature (view screen): 3-5 points
- Medium feature (CRUD): 8-13 points
- Complex feature (workflow): 13-21 points

### Complexity Scoring
**Simple**: Single screen, basic CRUD, no business logic
**Medium**: Multiple screens, moderate logic, API integration
**Complex**: Multi-step workflow, complex business rules, external dependencies

### Duration Estimation
- Simple feature: 1-3 days
- Medium feature: 1-2 weeks
- Complex feature: 2-4 weeks
- Infrastructure setup: 1 week
- Integration: 1-2 weeks per service

## Dependencies & Risks

Identify:
1. **Technical Dependencies**: Database, auth, APIs that must exist first
2. **External Dependencies**: Third-party services, data migrations
3. **Team Dependencies**: Skill requirements, training needs
4. **Risk Factors**: Unknowns, complex integrations, performance concerns

## Output Format

Return JSON:
{
  "deliveryTimeline": {
    "phases": [
      {
        "name": "Phase 1: MVP Foundation",
        "duration": "5 weeks (Weeks 1-5)",
        "teamSize": {
          "developers": 5,
          "designers": 1,
          "qa": 1
        },
        "deliverables": [
          "Authentication system",
          "User management (read-only)",
          "Basic navigation",
          ...
        ],
        "milestones": [
          {
            "week": 2,
            "milestone": "Auth system complete and tested"
          },
          {
            "week": 4,
            "milestone": "Core data viewing functional"
          },
          {
            "week": 5,
            "milestone": "MVP foundation demo ready"
          }
        ],
        "costEstimate": {
          "min": 50000,
          "max": 75000
        }
      },
      // ... more phases
    ],
    "totalCost": {
      "labor": {
        "min": 150000,
        "max": 225000
      },
      "infrastructure": {
        "annual": {
          "min": 10000,
          "max": 25000
        }
      }
    },
    "resourceAllocation": {
      "developers": 5,
      "designers": 1,
      "qa": 2,
      "pm": 1
    },
    "timelineDependencies": [
      {
        "week": 1,
        "dependency": "Database schema finalized"
      },
      {
        "week": 4,
        "dependency": "Email service (SendGrid) configured"
      }
    ],
    "riskFactors": [
      "Data migration from legacy system may delay Phase 2",
      "Third-party API availability for Phase 3 integrations",
      "Performance testing may reveal optimization needs"
    ]
  },
  "questions": []
}

## Important Notes

- Be realistic with estimates (add buffer for unknowns)
- Sequence features by dependency (auth before everything)
- Front-load risk (tackle hard problems in Phase 1-2)
- Show incremental value (each phase delivers something usable)
- Include testing strategy for each phase
- Account for technical debt and refactoring time`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson } = context;
    
    // Analyze feature complexity
    const screenCount = prdJson.screens?.length || 0;
    const apiCount = prdJson.api?.length || 0;
    const dataModelCount = prdJson.dataModel 
      ? ('entities' in prdJson.dataModel 
        ? Object.keys(prdJson.dataModel.entities || {}).length 
        : Object.keys(prdJson.dataModel).length)
      : 0;
    
    // Categorize screens by complexity
    const authScreens = prdJson.screens?.filter(s => /login|auth|register|password/.test(s.name.toLowerCase())) || [];
    const dashboardScreens = prdJson.screens?.filter(s => /dashboard|home|overview/.test(s.name.toLowerCase())) || [];
    const crudScreens = prdJson.screens?.filter(s => /list|form|edit|create|detail/.test(s.name.toLowerCase())) || [];
    
    // Identify dependencies
    const hasAuth = authScreens.length > 0;
    const hasRoles = prdJson.roleDefinition?.roles && prdJson.roleDefinition.roles.length > 0;
    const hasFileUpload = prdJson.api?.some(a => /upload|file|document/.test(a.endpoint.toLowerCase()));
    const hasNotifications = prdJson.api?.some(a => /notif|email|sms/.test(a.endpoint.toLowerCase()));
    const hasPayments = prdJson.api?.some(a => /payment|billing|checkout/.test(a.endpoint.toLowerCase()));
    
    return `# Implementation Roadmap Generation

Create a realistic, phased implementation plan for this product.

## Product Scale

**Total Scope**:
- ${screenCount} screens to implement
- ${apiCount} API endpoints to develop
- ${dataModelCount} data models to define
- Authentication: ${hasAuth ? "Required" : "Not detected"}
- Role-based access: ${hasRoles ? "Required" : "Not detected"}

## Feature Breakdown

**Authentication Screens**: ${authScreens.length}
${authScreens.map(s => `- ${s.name}`).join("\n") || "None"}

**Dashboard/Overview Screens**: ${dashboardScreens.length}
${dashboardScreens.slice(0, 5).map(s => `- ${s.name}`).join("\n") || "None"}

**CRUD/Management Screens**: ${crudScreens.length}
${crudScreens.slice(0, 10).map(s => `- ${s.name}`).join("\n") || "None"}

**Other Screens**: ${screenCount - authScreens.length - dashboardScreens.length - crudScreens.length}

## MVP Scope Definition

**Features for MVP**:
${prdJson.mvpScope?.features?.map((item: any, i: number) => `${i + 1}. ${item.name} (${item.priority} priority)`).join("\n") || "Not specified"}

**Out of Scope**:
${prdJson.mvpScope?.outOfScope?.map((item: any, i: number) => `${i + 1}. ${item}`).join("\n") || "Not specified"}

## Critical User Flows

${prdJson.criticalUserFlows?.slice(0, 5).map((flow: any, i: number) => `
**Flow ${i + 1}: ${flow.name || "Unnamed"}**
- Role: ${flow.role || "Any user"}
- Goal: ${flow.goal || "Not specified"}
- Steps: ${flow.steps?.length || 0} steps
`).join("\n") || "Not specified"}

## Technical Requirements

${prdJson.technicalRequirements?.slice(0, 10).map((req: any, i: number) => 
  `${i + 1}. ${req.description || req.requirement || "Not specified"}`
).join("\n") || "Not specified"}

## Dependencies Detected

**File Upload Required**: ${hasFileUpload ? "Yes (needs S3 or file storage)" : "No"}
**Notifications Required**: ${hasNotifications ? "Yes (needs email/SMS service)" : "No"}
**Payments Required**: ${hasPayments ? "Yes (needs payment gateway)" : "No"}

## Service Dependencies

${prdJson.dependencies?.service?.map((dep: any) => 
  `- ${dep.name || dep}: ${dep.description || ""}`
).join("\n") || "None specified"}

## Risk Factors

${prdJson.riskManagement?.risks?.slice(0, 5).map((risk: any, i: number) => 
  `${i + 1}. ${risk.description || "Not specified"} (${risk.likelihood || "unknown"} likelihood, ${risk.impact || "unknown"} impact)`
).join("\n") || "Not yet analyzed"}

## Technical Stack

**Technologies**: ${prdJson.aiMetadata?.stackDetected?.join(", ") || "Not specified"}

---

## Task

Generate a 3-phase implementation roadmap (12-16 weeks total) that:

1. **Sequences features logically** (auth first, then read, then write, then advanced)
2. **Identifies all dependencies** (technical, external, team)
3. **Provides realistic estimates** (based on feature complexity)
4. **Defines clear milestones** (weekly checkpoints)
5. **Includes cost estimates** (labor and infrastructure)
6. **Highlights risks** (what could delay the project)
7. **Specifies deliverables** (what's done each phase)

Make estimates realistic and account for:
- Learning curve with new tech
- Integration complexity
- Testing and QA time
- Buffer for unknowns (20-30%)
- Code review and refactoring

Assume a team of 5 developers, 1 designer, 1-2 QA, working in 2-week sprints.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.deliveryTimeline as DeliveryTimeline,
      questions: parsed.questions || [],
    };
  },
};
