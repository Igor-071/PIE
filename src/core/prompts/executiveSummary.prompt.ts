import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { ExecutiveSummary } from "../../models/schema.js";

export const executiveSummaryPrompt: SectionPrompt = {
  name: "executiveSummary",
  systemPrompt: `You are a senior product manager crafting an executive summary for C-level stakeholders, investors, and non-technical decision-makers.

## Your Mission

Create a compelling, business-focused narrative that synthesizes the entire PRD into a cohesive executive summary. This summary must be:

- **Comprehensive yet concise**: 500-800 words total
- **Business-focused**: Emphasize outcomes over implementation details
- **Strategic**: Connect features to business value
- **Accessible**: No technical jargon without explanation
- **Compelling**: Tell a story that resonates with executives

## Required Components

1. **Overview** (2-3 sentences)
   - Opening hook with the problem context
   - High-level description of the product
   - Primary value proposition

2. **Problem Statement** (2-3 sentences)
   - Paint a vivid picture of user pain
   - Include impact/consequences of the problem
   - Use data/metrics when available from evidence

3. **Solution Highlights** (3-4 sentences)
   - Explain how the product solves the problem
   - Highlight key capabilities (not feature lists)
   - Emphasize what makes this solution effective

4. **Key Differentiators** (3-5 bullet points)
   - What makes this product unique
   - Competitive advantages based on detected features
   - Technical advantages explained in business terms

5. **Target Market** (2-3 sentences)
   - Who will use this product
   - Market size/opportunity if inferable
   - Why these users need this solution

6. **Strategic Goals** (3-5 bullet points)
   - Business objectives (revenue, growth, efficiency)
   - User/customer outcomes
   - Measurable success criteria

7. **Technical Approach** (2-3 sentences)
   - High-level architecture in business terms
   - Why this technical approach enables business goals
   - Scalability/reliability positioning

8. **Risk Overview** (2-3 sentences)
   - Top 2-3 risks and mitigation strategies
   - Realistic about challenges but confident in approach
   - Timeline/resource considerations

9. **Vision Statement** (1-2 sentences)
   - Aspirational future state
   - Long-term impact on users/industry

## Writing Guidelines

- Use active voice and confident tone
- Include specific numbers (screens, APIs, users) when available
- Translate technical features into business benefits
- Make it suitable for board presentations or investor decks
- Avoid phrases like "the system will" - focus on user benefits
- Use industry-specific language appropriate to the domain

## Output Format

Return JSON with this structure:
{
  "executiveSummary": {
    "overview": "2-3 sentence overview...",
    "problemStatement": "2-3 sentence problem...",
    "solutionHighlights": "3-4 sentence solution...",
    "keyDifferentiators": ["Differentiator 1", "Differentiator 2", ...],
    "targetMarket": "2-3 sentence target market...",
    "strategicGoals": ["Goal 1", "Goal 2", ...],
    "technicalApproach": "2-3 sentence technical approach...",
    "riskOverview": "2-3 sentence risk overview...",
    "visionStatement": "1-2 sentence vision..."
  },
  "questions": []
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson } = context;
    
    // Gather key metrics
    const screenCount = prdJson.screens?.length || 0;
    const apiCount = prdJson.api?.length || 0;
    const dataModelCount = prdJson.dataModel 
      ? ('entities' in prdJson.dataModel 
        ? Object.keys(prdJson.dataModel.entities || {}).length 
        : Object.keys(prdJson.dataModel).length)
      : 0;
    
    // Identify domain
    const domain = inferDomain(prdJson);
    
    // Get key features
    const keyFeatures = prdJson.solutionOverview?.keyFeatures?.slice(0, 10) || [];
    
    // Get top risks
    const topRisks = prdJson.riskManagement?.risks?.slice(0, 3).map((r: any) => r.description).join(", ") || "Not yet analyzed";
    
    // Get tech stack info
    const techStack = prdJson.aiMetadata?.stackDetected?.join(", ") || "Not specified";
    
    return `# Generate Executive Summary

Synthesize ALL sections of this PRD into a compelling executive summary suitable for C-level stakeholders, investors, and board presentations.

## Product Context

**Project**: ${prdJson.project?.name || "Unknown"}
**Domain**: ${domain}
**Scale**: ${screenCount} screens, ${apiCount} API endpoints, ${dataModelCount} data models

## Brand & Mission

**Mission**: ${prdJson.brandFoundations?.mission || "Not specified"}
**Vision**: ${prdJson.brandFoundations?.vision || "Not specified"}
**Core Values**: ${prdJson.brandFoundations?.coreValues?.join(", ") || "Not specified"}

## Problem & Solution

**Primary Problem**: ${prdJson.problemDefinition?.primaryProblem || "Not specified"}
**Value Proposition**: ${prdJson.solutionOverview?.valueProposition || "Not specified"}
**Key Differentiators**: ${prdJson.solutionOverview?.differentiators?.join(", ") || "Not specified"}

## Target Users

${prdJson.targetAudience?.map(a => `
**${a.name}**
- Demographics: ${a.demographics || "Not specified"}
- Goals: ${a.goals?.slice(0, 3).join(", ") || "Not specified"}
- Pain Points: ${a.painPoints?.slice(0, 2).join("; ") || "Not specified"}
`).join("\n") || "Not specified"}

## Key Features

${keyFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n") || "Not specified"}

## Strategic Goals

**Primary Goals**: ${prdJson.goalsAndSuccessCriteria?.primaryGoals?.join(", ") || "Not specified"}
**Success Metrics**: ${prdJson.goalsAndSuccessCriteria?.successMetrics?.map(m => m.name).join(", ") || "Not specified"}

## Technical Overview

**Tech Stack**: ${techStack}

## Risk Overview

**Top Risks**: ${topRisks}

## MVP Scope

**Features**: ${prdJson.mvpScope?.features?.slice(0, 5).map((f: any) => f.name).join(", ") || "Not specified"}
**Out of Scope**: ${prdJson.mvpScope?.outOfScope?.slice(0, 3).join(", ") || "Not specified"}

## Competitive Position

**Market Category**: ${prdJson.competitiveAnalysis?.marketCategory || "Not specified"}
**Competitors**: ${prdJson.competitiveAnalysis?.competitors?.join(", ") || "Not specified"}

---

## Task

Generate a compelling executive summary that tells the complete product story. Make it:
- Suitable for a board presentation
- Clear enough for non-technical executives
- Compelling enough to excite investors
- Specific enough to demonstrate deep understanding
- Strategic enough to guide decision-making

Focus on business value, strategic positioning, and measurable outcomes.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.executiveSummary as ExecutiveSummary,
      questions: parsed.questions || [],
    };
  },
};

function inferDomain(prdJson: any): string {
  const screenNames = prdJson.screens?.map((s: any) => s.name.toLowerCase()).join(" ") || "";
  const apiPaths = prdJson.api?.map((a: any) => a.endpoint.toLowerCase()).join(" ") || "";
  const combined = screenNames + " " + apiPaths;
  
  if (/patient|clinic|doctor|medical|health|appointment|treatment/.test(combined)) return "Healthcare";
  if (/inventory|stock|warehouse|supplier|order/.test(combined)) return "Inventory Management";
  if (/e-commerce|cart|checkout|product|shop/.test(combined)) return "E-commerce";
  if (/dashboard|analytics|report|metric/.test(combined)) return "Analytics/Business Intelligence";
  if (/user|profile|auth|login/.test(combined)) return "User Management Platform";
  
  return "Software Platform";
}
