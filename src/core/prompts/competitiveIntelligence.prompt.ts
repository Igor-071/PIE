import { SectionPrompt, PromptContext, PromptResult } from "./promptTemplate.js";
import { CompetitiveAnalysis } from "../../models/schema.js";

export const competitiveIntelligencePrompt: SectionPrompt = {
  name: "competitiveIntelligence",
  systemPrompt: `You are a market analyst and competitive intelligence expert specializing in software product positioning.

## Your Mission

Based on the product's features, domain, target audience, and technical sophistication, infer a comprehensive competitive analysis. Even without external market data, you can make intelligent inferences about:

- Market category and competitive landscape
- Likely competitors based on domain and features
- Competitive advantages from detected capabilities
- Market positioning strategy
- Go-to-market considerations

## Analysis Framework

### 1. Market Category Identification
Determine the primary and secondary market categories this product competes in based on:
- Feature set (screens, APIs, data models)
- Target users (personas, roles)
- Problem being solved
- Technical sophistication

### 2. Competitive Landscape Inference
Identify likely competitors using pattern matching:
- **Healthcare + EMR features** → Epic, Cerner, athenahealth, DrChrono
- **Inventory + E-commerce** → ShipStation, Inventory Source, TradeGecko
- **Project Management** → Jira, Asana, Monday.com
- **CRM** → Salesforce, HubSpot, Pipedrive
- Apply domain knowledge to infer competitive set

### 3. Competitive Advantages Detection
Analyze the codebase evidence to identify advantages:
- **Modern tech stack** (React, Next.js) vs legacy competitors
- **Integrated workflows** vs. fragmented solutions
- **Specific features** competitors may lack
- **User experience focus** (responsive design, mobile-first)
- **Technical capabilities** (real-time updates, API-first architecture)

### 4. Market Positioning Strategy
Based on feature complexity and target users, infer:
- **Enterprise** (complex features, role-based access, advanced security)
- **SMB** (streamlined features, easy setup, affordable)
- **Consumer** (simple UX, self-service, viral features)
- **Prosumer** (advanced features with consumer-grade UX)

### 5. Pricing Strategy Hints
Estimate pricing model and range based on:
- Feature complexity (more features → higher price)
- Target market (enterprise → higher, SMB → lower)
- Competitive benchmarks for the industry
- Value delivered (time saved, efficiency gains)

### 6. Go-to-Market Considerations
Suggest distribution channels and marketing approaches:
- Direct sales vs. self-service
- Industry-specific channels (conferences, associations)
- Digital marketing strategies
- Partnership opportunities

## Output Format

Return JSON:
{
  "competitiveAnalysis": {
    "marketCategory": "Primary category and secondary categories",
    "positioningSummary": "2-3 sentence positioning statement",
    "comparativeDimensions": ["Dimension 1", "Dimension 2", ...],
    "competitors": ["Competitor 1", "Competitor 2", ...],
    "differentiationStrategy": {
      "keyOpportunities": ["Opportunity 1", "Opportunity 2", ...],
      "uniqueSellingPoints": ["USP 1", "USP 2", ...],
      "whiteSpaceInsights": "2-3 sentences on market gaps",
      "blueOceanIndicators": ["Indicator 1", "Indicator 2", ...]
    },
    "visualReferences": ["Reference 1", "Reference 2", ...]
  },
  "questions": [
    {
      "field": "competitiveAnalysis.competitors",
      "question": "Which specific competitors should we focus on?",
      "reason": "Inferred from domain but client may have specific competitive intel",
      "priority": "medium"
    }
  ]
}`,

  generateUserPrompt: (context: PromptContext): string => {
    const { prdJson } = context;
    
    // Analyze feature sophistication
    const screenCount = prdJson.screens?.length || 0;
    const apiCount = prdJson.api?.length || 0;
    const hasRoles = prdJson.roleDefinition?.roles && prdJson.roleDefinition.roles.length > 0;
    const hasAuth = prdJson.screens?.some(s => s.name.toLowerCase().includes("login") || s.name.toLowerCase().includes("auth"));
    
    // Determine sophistication level
    let sophistication = "Simple";
    if (screenCount > 20 && apiCount > 30) sophistication = "Enterprise";
    else if (screenCount > 10 && apiCount > 15) sophistication = "Professional";
    else if (screenCount > 5) sophistication = "Standard";
    
    // Get tech stack
    const stackDetected = prdJson.aiMetadata?.stackDetected?.join(", ") || "Unknown";
    const isModernStack = /react|vue|angular|next|svelte/i.test(stackDetected);
    
    return `# Competitive Intelligence Analysis

Infer a comprehensive competitive analysis based on the product characteristics below.

## Product Profile

**Project**: ${prdJson.project?.name || "Unknown"}
**Sophistication Level**: ${sophistication}
**Feature Count**: ${screenCount} screens, ${apiCount} APIs
**Has Role-Based Access**: ${hasRoles ? "Yes" : "No"}
**Has Authentication**: ${hasAuth ? "Yes" : "No"}
**Modern Tech Stack**: ${isModernStack ? "Yes" : "No"} (${stackDetected})

## Domain & Problem

**Primary Problem**: ${prdJson.problemDefinition?.primaryProblem || "Not specified"}
**Solution Overview**: ${prdJson.solutionOverview?.valueProposition || "Not specified"}
**Domain Indicators**: ${getDomainIndicators(prdJson)}

## Target Users

${prdJson.targetAudience?.map(a => `
**${a.name}**
- Role: ${a.role || "Not specified"}
- Demographics: ${a.demographics || "Not specified"}
- Tech Comfort: ${a.techComfort || "Not specified"}
`).join("\n") || "Not specified"}

## Key Features & Capabilities

${prdJson.solutionOverview?.keyFeatures?.map((f, i) => `${i + 1}. ${f}`).join("\n") || "Not specified"}

## Differentiators Claimed

${prdJson.solutionOverview?.differentiators?.map((d, i) => `${i + 1}. ${d}`).join("\n") || "Not specified"}

## Technical Capabilities

**Technologies**: ${stackDetected}
**Real-time Features**: ${prdJson.screens?.some(s => /dashboard|live|real-time/.test(s.name.toLowerCase())) ? "Yes" : "Unknown"}

## Business Model Hints

**Lean Canvas**: 
- Value Proposition: ${prdJson.leanCanvas?.uniqueValueProposition || "Not specified"}
- Customer Segments: ${prdJson.leanCanvas?.customerSegments?.join(", ") || "Not specified"}
- Revenue Streams: ${prdJson.leanCanvas?.revenueStreams?.join(", ") || "Not specified"}
- Channels: ${prdJson.leanCanvas?.channels?.join(", ") || "Not specified"}

---

## Task

Generate a comprehensive competitive intelligence report. Use domain knowledge to:

1. **Identify the market category** (be specific - not just "SaaS")
2. **Infer likely competitors** (use industry knowledge for this domain)
3. **Detect competitive advantages** from features and tech stack
4. **Determine positioning** (enterprise vs SMB vs consumer)
5. **Estimate pricing strategy** (model and rough range)
6. **Suggest go-to-market approach** (channels, strategies)
7. **Identify market gaps** (white space opportunities)

Be specific and insightful. Use your knowledge of typical competitive landscapes in this domain.`;
  },

  parseResponse: (response: string): PromptResult => {
    const parsed = JSON.parse(response);
    return {
      sectionData: parsed.competitiveAnalysis as CompetitiveAnalysis,
      questions: parsed.questions || [],
    };
  },
};

function getDomainIndicators(prdJson: any): string {
  const indicators: string[] = [];
  const screenNames = prdJson.screens?.map((s: any) => s.name.toLowerCase()).join(" ") || "";
  const apiPaths = prdJson.api?.map((a: any) => a.endpoint.toLowerCase()).join(" ") || "";
  
  if (/patient|clinic|doctor|medical/.test(screenNames)) indicators.push("Healthcare");
  if (/inventory|stock|warehouse/.test(screenNames)) indicators.push("Inventory Management");
  if (/cart|checkout|product/.test(screenNames)) indicators.push("E-commerce");
  if (/dashboard|analytics/.test(screenNames)) indicators.push("Analytics");
  if (/schedule|appointment|calendar/.test(screenNames)) indicators.push("Scheduling");
  if (/user|profile|auth/.test(screenNames)) indicators.push("User Management");
  
  return indicators.length > 0 ? indicators.join(", ") : "General Application";
}
