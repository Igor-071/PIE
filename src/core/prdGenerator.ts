import { promises as fs } from "fs";
import path from "path";
import { PrdJson, QuestionsForClient } from "../models/schema.js";

export interface PrdArtifactsOptions {
  outputDir: string;
  projectName: string;
  templatePath?: string;
}

/**
 * Writes PRD artifacts to the output directory:
 * - PRD markdown file
 * - Structured JSON file
 * - Questions for client JSON file
 * @param prd - The complete PRD JSON data
 * @param questions - Questions for the client
 * @param options - Output options including directory, project name, and template path
 * @returns Promise resolving to an object with the markdown filename
 */
export async function writePrdArtifacts(
  prd: PrdJson,
  questions: QuestionsForClient,
  options: PrdArtifactsOptions
): Promise<{ markdownFilename: string }> {
  // Ensure output directory exists
  await fs.mkdir(options.outputDir, { recursive: true });

  // Write structured JSON
  const jsonPath = path.join(options.outputDir, "prd-structured.json");
  await fs.writeFile(jsonPath, JSON.stringify(prd, null, 2), "utf-8");

  // Write questions JSON
  const questionsPath = path.join(options.outputDir, "questions-for-client.json");
  await fs.writeFile(questionsPath, JSON.stringify(questions, null, 2), "utf-8");

  // Generate and write Markdown PRD
  const markdownContent = await generatePrdMarkdown(prd, options);
  const projectNameForFile = prd.project?.name || options.projectName;
  const sanitizedProjectName = projectNameForFile
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const markdownFilename = `PRD_${sanitizedProjectName}.md`;
  const markdownPath = path.join(options.outputDir, markdownFilename);
  await fs.writeFile(markdownPath, markdownContent, "utf-8");

  console.log(`PRD written to: ${markdownPath}`);
  console.log(`Structured JSON written to: ${jsonPath}`);
  console.log(`Questions written to: ${questionsPath}`);

  return { markdownFilename };
}

/**
 * Generates a comprehensive markdown PRD from the JSON data
 * @param prd - The complete PRD JSON data
 * @param options - Options including template path
 * @returns Promise resolving to markdown string
 */
async function generatePrdMarkdown(
  prd: PrdJson,
  options: PrdArtifactsOptions
): Promise<string> {
  const projectName = prd.project?.name || options.projectName;

  let markdown = `# Product Requirements Document: ${projectName}\n\n`;

  // ============================================================================
  // 1. SUMMARY & PROJECT INFO
  // ============================================================================
  markdown += `## 1. Summary\n\n`;
  markdown += `**Project Name:** ${projectName}\n`;
  markdown += `**Version:** ${prd.project?.version || "1.0.0"}\n`;
  markdown += `**Created:** ${new Date(prd.project?.createdAt || Date.now()).toLocaleDateString()}\n\n`;

  if (prd.solutionOverview?.valueProposition) {
    markdown += `### Value Proposition\n${prd.solutionOverview.valueProposition}\n\n`;
  }

  // ============================================================================
  // 2. BRAND FOUNDATIONS
  // ============================================================================
  if (prd.brandFoundations) {
    markdown += `## 2. Brand Foundations\n\n`;
    
    if (prd.brandFoundations.mission) {
      markdown += `### Mission\n${prd.brandFoundations.mission}\n\n`;
    }
    
    if (prd.brandFoundations.vision) {
      markdown += `### Vision\n${prd.brandFoundations.vision}\n\n`;
    }
    
    if (prd.brandFoundations.coreValues && Array.isArray(prd.brandFoundations.coreValues) && prd.brandFoundations.coreValues.length > 0) {
      markdown += `### Core Values\n`;
      prd.brandFoundations.coreValues.forEach((value) => {
        markdown += `- ${value}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.brandFoundations.toneOfVoice) {
      markdown += `### Tone of Voice\n${prd.brandFoundations.toneOfVoice}\n\n`;
    }
  }

  // ============================================================================
  // 3. PROBLEM DEFINITION
  // ============================================================================
  if (prd.problemDefinition) {
    markdown += `## 3. Problem Statement & User Needs\n\n`;
    
    if (prd.problemDefinition.primaryProblem) {
      markdown += `### Primary Problem\n${prd.problemDefinition.primaryProblem}\n\n`;
    }
    
    if (prd.problemDefinition.secondaryProblems) {
      markdown += `### Secondary Problems\n`;
      const problems = Array.isArray(prd.problemDefinition.secondaryProblems) 
        ? prd.problemDefinition.secondaryProblems 
        : [prd.problemDefinition.secondaryProblems];
      problems.forEach((problem) => {
        markdown += `- ${problem}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.problemDefinition.userPainPoints) {
      markdown += `### User Pain Points\n`;
      const painPoints = Array.isArray(prd.problemDefinition.userPainPoints)
        ? prd.problemDefinition.userPainPoints
        : [prd.problemDefinition.userPainPoints];
      painPoints.forEach((pain) => {
        markdown += `> "${pain}"\n\n`;
      });
    }
    
    if (prd.problemDefinition.businessImpact) {
      markdown += `### Business Impact\n${prd.problemDefinition.businessImpact}\n\n`;
    }
  }

  // ============================================================================
  // 4. SOLUTION OVERVIEW
  // ============================================================================
  if (prd.solutionOverview) {
    markdown += `## 4. Solution Overview\n\n`;
    
    if (prd.solutionOverview.keyFeatures) {
      markdown += `### Key Features\n`;
      const features = Array.isArray(prd.solutionOverview.keyFeatures)
        ? prd.solutionOverview.keyFeatures
        : [prd.solutionOverview.keyFeatures];
      features.forEach((feature) => {
        markdown += `- ${feature}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.solutionOverview.differentiators) {
      markdown += `### Differentiators\n${prd.solutionOverview.differentiators}\n\n`;
    }
    
    if (prd.solutionOverview.nonFunctionalRequirements) {
      markdown += `### Non-Functional Requirements\n`;
      const nfrs = Array.isArray(prd.solutionOverview.nonFunctionalRequirements)
        ? prd.solutionOverview.nonFunctionalRequirements
        : [prd.solutionOverview.nonFunctionalRequirements];
      nfrs.forEach((req) => {
        markdown += `- ${req}\n`;
      });
      markdown += `\n`;
    }
  }

  // ============================================================================
  // 5. TARGET AUDIENCE & PERSONAS
  // ============================================================================
  if (prd.targetAudience && prd.targetAudience.length > 0) {
    markdown += `## 5. Target Audience & Personas\n\n`;
    
    prd.targetAudience.forEach((persona, index) => {
      markdown += `### Persona ${index + 1}: ${persona.name}\n\n`;
      
      if (persona.demographics) {
        markdown += `**Demographics:**\n`;
        if (typeof persona.demographics === 'object') {
          Object.entries(persona.demographics).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              markdown += `- ${key}: ${value.join(", ")}\n`;
            } else {
              markdown += `- ${key}: ${value}\n`;
            }
          });
        } else {
          markdown += `${persona.demographics}\n`;
        }
        markdown += `\n`;
      }
      
      if (persona.goals) {
        markdown += `**Goals:** ${persona.goals}\n\n`;
      }
      
      if (persona.painPoints && Array.isArray(persona.painPoints) && persona.painPoints.length > 0) {
        markdown += `**Pain Points:**\n`;
        persona.painPoints.forEach((pain) => {
          markdown += `> "${pain}"\n\n`;
        });
      }
      
      if (persona.jobsToBeDone && Array.isArray(persona.jobsToBeDone) && persona.jobsToBeDone.length > 0) {
        markdown += `**Jobs to Be Done:**\n`;
        persona.jobsToBeDone.forEach((job) => {
          markdown += `- ${job}\n`;
        });
        markdown += `\n`;
      }
    });
  }

  // ============================================================================
  // 6. LEAN CANVAS
  // ============================================================================
  if (prd.leanCanvas) {
    markdown += `## 6. Lean Canvas\n\n`;
    
    if (prd.leanCanvas.uniqueValueProposition) {
      markdown += `### Unique Value Proposition\n${prd.leanCanvas.uniqueValueProposition}\n\n`;
    }
    
    if (prd.leanCanvas.customerSegments && Array.isArray(prd.leanCanvas.customerSegments) && prd.leanCanvas.customerSegments.length > 0) {
      markdown += `### Customer Segments\n`;
      prd.leanCanvas.customerSegments.forEach((segment) => {
        markdown += `- ${segment}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.leanCanvas.keyMetrics && Array.isArray(prd.leanCanvas.keyMetrics) && prd.leanCanvas.keyMetrics.length > 0) {
      markdown += `### Key Metrics\n`;
      prd.leanCanvas.keyMetrics.forEach((metric) => {
        markdown += `- ${metric}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.leanCanvas.channels && Array.isArray(prd.leanCanvas.channels) && prd.leanCanvas.channels.length > 0) {
      markdown += `### Channels\n`;
      prd.leanCanvas.channels.forEach((channel) => {
        markdown += `- ${channel}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.leanCanvas.revenueStreams && Array.isArray(prd.leanCanvas.revenueStreams) && prd.leanCanvas.revenueStreams.length > 0) {
      markdown += `### Revenue Streams\n`;
      prd.leanCanvas.revenueStreams.forEach((stream) => {
        markdown += `- ${stream}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.leanCanvas.costStructure && Array.isArray(prd.leanCanvas.costStructure) && prd.leanCanvas.costStructure.length > 0) {
      markdown += `### Cost Structure\n`;
      prd.leanCanvas.costStructure.forEach((cost) => {
        markdown += `- ${cost}\n`;
      });
      markdown += `\n`;
    }
  }

  // ============================================================================
  // 7. COMPETITIVE ANALYSIS
  // ============================================================================
  if (prd.competitiveAnalysis) {
    markdown += `## 7. Competitive Analysis\n\n`;
    markdown += `${prd.competitiveAnalysis}\n\n`;
  }

  // ============================================================================
  // 8. SCREENS & USER INTERFACE
  // ============================================================================
  if (prd.screens && prd.screens.length > 0) {
    markdown += `## 8. Screens & User Interface\n\n`;
    markdown += `The application consists of ${prd.screens.length} screens:\n\n`;
    
    markdown += `| Screen Name | Purpose | Path |\n`;
    markdown += `|-------------|---------|------|\n`;
    prd.screens.forEach((screen) => {
      markdown += `| ${screen.name} | ${screen.purpose || "-"} | \`${screen.path}\` |\n`;
    });
    markdown += `\n`;
  }

  // ============================================================================
  // 9. NAVIGATION STRUCTURE
  // ============================================================================
  if (prd.navigation && prd.navigation.length > 0) {
    markdown += `## 9. Navigation Structure\n\n`;
    markdown += `The application has ${prd.navigation.length} navigation routes:\n\n`;
    
    markdown += `| From Screen | To Screen | Event/Label |\n`;
    markdown += `|-------------|-----------|-------------|\n`;
    prd.navigation.forEach((nav) => {
      markdown += `| ${nav.fromScreenId || "-"} | ${nav.toScreenId || "-"} | ${nav.event || nav.label || "-"} |\n`;
    });
    markdown += `\n`;
  }

  // ============================================================================
  // 10. API ENDPOINTS
  // ============================================================================
  if (prd.api && prd.api.length > 0) {
    markdown += `## 10. API Endpoints\n\n`;
    
    markdown += `| Method | Endpoint | Name | Handler |\n`;
    markdown += `|--------|----------|------|----------|\n`;
    prd.api.forEach((endpoint) => {
      markdown += `| ${endpoint.method || "-"} | \`${endpoint.endpoint}\` | ${endpoint.name || "-"} | \`${endpoint.handler || "-"}\` |\n`;
    });
    markdown += `\n`;
  }

  // ============================================================================
  // 11. DATA MODEL
  // ============================================================================
  if (prd.dataModel && Object.keys(prd.dataModel).length > 0) {
    markdown += `## 11. Data Model\n\n`;
    
    Object.entries(prd.dataModel).forEach(([entityName, entity]) => {
      markdown += `### ${entityName}\n\n`;
      
      if (entity.fields && Object.keys(entity.fields).length > 0) {
        markdown += `| Field | Type | Required |\n`;
        markdown += `|-------|------|----------|\n`;
        Object.entries(entity.fields).forEach(([fieldName, field]) => {
          markdown += `| ${fieldName} | ${field.type} | ${field.required ? "✓" : "-"} |\n`;
        });
        markdown += `\n`;
      }
    });
  }

  // ============================================================================
  // 12. EVENTS & USER INTERACTIONS
  // ============================================================================
  if (prd.events && prd.events.length > 0) {
    markdown += `## 12. User Interactions & Events\n\n`;
    markdown += `The application handles ${prd.events.length} user interaction events.\n\n`;
    
    // Group events by type
    const eventsByType: Record<string, typeof prd.events> = {};
    prd.events.forEach((event) => {
      const type = event.type || "other";
      if (!eventsByType[type]) {
        eventsByType[type] = [];
      }
      eventsByType[type].push(event);
    });
    
    Object.entries(eventsByType).forEach(([type, events]) => {
      markdown += `### ${type.replace(/-/g, " ").toUpperCase()}\n\n`;
      events.slice(0, 10).forEach((event) => {
        markdown += `- **${event.trigger || event.name || "Event"}**: ${event.outputs?.join(", ") || event.handler || "-"}\n`;
      });
      if (events.length > 10) {
        markdown += `\n... and ${events.length - 10} more\n`;
      }
      markdown += `\n`;
    });
  }

  // ============================================================================
  // 13. TECHNICAL STACK
  // ============================================================================
  if (prd.aiMetadata?.stackDetected && prd.aiMetadata.stackDetected.length > 0) {
    markdown += `## 13. Technical Stack\n\n`;
    prd.aiMetadata.stackDetected.forEach((tech) => {
      markdown += `- ${tech}\n`;
    });
    markdown += `\n`;
  }

  // ============================================================================
  // APPENDIX: AI METADATA
  // ============================================================================
  if (prd.aiMetadata) {
    markdown += `---\n\n## Appendix: AI Extraction Metadata\n\n`;
    markdown += `**Extracted At:** ${new Date(prd.aiMetadata.extractedAt || Date.now()).toLocaleString()}\n\n`;
    
    if (prd.aiMetadata.extractionNotes) {
      markdown += `**Extraction Notes:** ${prd.aiMetadata.extractionNotes}\n\n`;
    }
  }

  return markdown;
}
