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
    if (typeof prd.competitiveAnalysis === "string") {
      markdown += `${prd.competitiveAnalysis}\n\n`;
    } else {
      if (prd.competitiveAnalysis.marketCategory) {
        markdown += `### Market Category\n${prd.competitiveAnalysis.marketCategory}\n\n`;
      }
      if (prd.competitiveAnalysis.competitors && prd.competitiveAnalysis.competitors.length > 0) {
        markdown += `### Competitors\n`;
        prd.competitiveAnalysis.competitors.forEach((comp) => {
          markdown += `- ${comp}\n`;
        });
        markdown += `\n`;
      }
      if (prd.competitiveAnalysis.positioningSummary) {
        markdown += `### Positioning Summary\n${prd.competitiveAnalysis.positioningSummary}\n\n`;
      }
    }
  }

  // ============================================================================
  // 8. GOALS & SUCCESS CRITERIA
  // ============================================================================
  if (prd.goalsAndSuccessCriteria) {
    markdown += `## 8. Goals & Success Criteria\n\n`;
    
    if (prd.goalsAndSuccessCriteria.primaryGoals && prd.goalsAndSuccessCriteria.primaryGoals.length > 0) {
      markdown += `### Primary Goals\n\n`;
      prd.goalsAndSuccessCriteria.primaryGoals.forEach((goal, index) => {
        markdown += `${index + 1}. ${goal}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.goalsAndSuccessCriteria.successMetrics && prd.goalsAndSuccessCriteria.successMetrics.length > 0) {
      markdown += `### Success Metrics (KPIs)\n\n`;
      markdown += `| Metric | Description | Target | Measurement Method |\n`;
      markdown += `|--------|-------------|--------|---------------------|\n`;
      prd.goalsAndSuccessCriteria.successMetrics.forEach((metric) => {
        markdown += `| ${metric.name} | ${metric.description} | ${metric.target || "-"} | ${metric.measurementMethod || "-"} |\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.goalsAndSuccessCriteria.kpis && prd.goalsAndSuccessCriteria.kpis.length > 0) {
      markdown += `### Key Performance Indicators\n\n`;
      prd.goalsAndSuccessCriteria.kpis.forEach((kpi) => {
        markdown += `- ${kpi}\n`;
      });
      markdown += `\n`;
    }
  }

  // ============================================================================
  // 9. MVP SCOPE
  // ============================================================================
  if (prd.mvpScope) {
    markdown += `## 9. MVP Scope (Phase ${prd.mvpScope.phase || "1"})\n\n`;
    
    if (prd.mvpScope.features && prd.mvpScope.features.length > 0) {
      markdown += `### Features Included\n\n`;
      prd.mvpScope.features.forEach((feature) => {
        markdown += `#### ${feature.name}\n\n`;
        markdown += `**Description:** ${feature.description}\n\n`;
        markdown += `**Priority:** ${feature.priority}\n\n`;
        if (feature.screens && feature.screens.length > 0) {
          markdown += `**Screens:** ${feature.screens.join(", ")}\n\n`;
        }
        if (feature.dependencies && feature.dependencies.length > 0) {
          markdown += `**Dependencies:** ${feature.dependencies.join(", ")}\n\n`;
        }
      });
    }
    
    if (prd.mvpScope.outOfScope && prd.mvpScope.outOfScope.length > 0) {
      markdown += `### Out of Scope\n\n`;
      prd.mvpScope.outOfScope.forEach((item) => {
        markdown += `- ${item}\n`;
      });
      markdown += `\n`;
    }
  }

  // ============================================================================
  // 10. ASSUMPTIONS
  // ============================================================================
  if (prd.assumptions) {
    markdown += `## 10. Assumptions\n\n`;
    
    if (prd.assumptions.technical && prd.assumptions.technical.length > 0) {
      markdown += `### Technical Assumptions\n\n`;
      prd.assumptions.technical.forEach((assumption) => {
        markdown += `- ${assumption}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.assumptions.operational && prd.assumptions.operational.length > 0) {
      markdown += `### Operational Assumptions\n\n`;
      prd.assumptions.operational.forEach((assumption) => {
        markdown += `- ${assumption}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.assumptions.financial && prd.assumptions.financial.length > 0) {
      markdown += `### Financial Assumptions\n\n`;
      prd.assumptions.financial.forEach((assumption) => {
        markdown += `- ${assumption}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.assumptions.legal && prd.assumptions.legal.length > 0) {
      markdown += `### Legal/Compliance Assumptions\n\n`;
      prd.assumptions.legal.forEach((assumption) => {
        markdown += `- ${assumption}\n`;
      });
      markdown += `\n`;
    }
  }

  // ============================================================================
  // 11. DEPENDENCIES
  // ============================================================================
  if (prd.dependencies) {
    markdown += `## 11. Dependencies\n\n`;
    
    if (prd.dependencies.service && prd.dependencies.service.length > 0) {
      markdown += `### Service Dependencies\n\n`;
      prd.dependencies.service.forEach((dep) => {
        markdown += `#### ${dep.name}\n\n`;
        markdown += `**Description:** ${dep.description}\n\n`;
        if (dep.impact) {
          markdown += `**Impact:** ${dep.impact}\n\n`;
        }
      });
    }
    
    if (prd.dependencies.operational && prd.dependencies.operational.length > 0) {
      markdown += `### Operational Dependencies\n\n`;
      prd.dependencies.operational.forEach((dep) => {
        markdown += `- ${dep.description}`;
        if (dep.requirement) {
          markdown += ` (Requirement: ${dep.requirement})`;
        }
        markdown += `\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.dependencies.content && prd.dependencies.content.length > 0) {
      markdown += `### Content & Legal Dependencies\n\n`;
      prd.dependencies.content.forEach((dep) => {
        markdown += `- ${dep.description}`;
        if (dep.source) {
          markdown += ` (Source: ${dep.source})`;
        }
        markdown += `\n`;
      });
      markdown += `\n`;
    }
  }

  // ============================================================================
  // 12. ROLE DEFINITION / ACCESS MODEL
  // ============================================================================
  if (prd.roleDefinition) {
    markdown += `## 12. Role Definition / Access Model\n\n`;
    
    if (prd.roleDefinition.roles && prd.roleDefinition.roles.length > 0) {
      markdown += `### Role Definitions\n\n`;
      prd.roleDefinition.roles.forEach((role) => {
        markdown += `#### ${role.name}\n\n`;
        markdown += `**ID:** ${role.id}\n\n`;
        markdown += `**Description:** ${role.description}\n\n`;
      });
    }
    
    if (prd.roleDefinition.accessMatrix && prd.roleDefinition.accessMatrix.length > 0) {
      markdown += `### Access Matrix\n\n`;
      // Get all unique role names from access matrix
      const roleColumns = new Set<string>();
      prd.roleDefinition.accessMatrix.forEach((matrix) => {
        Object.keys(matrix).forEach((key) => {
          if (key !== "feature") {
            roleColumns.add(key);
          }
        });
      });
      
      const roleHeaders = Array.from(roleColumns);
      markdown += `| Feature | ${roleHeaders.join(" | ")} |\n`;
      markdown += `|---------|${roleHeaders.map(() => "---").join("|")}|\n`;
      
      prd.roleDefinition.accessMatrix.forEach((matrix) => {
        const feature = (matrix as any).feature || "-";
        const cells = roleHeaders.map((role) => (matrix as any)[role] || "-");
        markdown += `| ${feature} | ${cells.join(" | ")} |\n`;
      });
      markdown += `\n`;
    }
  }

  // ============================================================================
  // 13. PRODUCT REQUIREMENTS / ACCEPTANCE CRITERIA
  // ============================================================================
  if (prd.productRequirements && prd.productRequirements.length > 0) {
    markdown += `## 13. Product Requirements / Acceptance Criteria\n\n`;
    
    prd.productRequirements.forEach((req) => {
      markdown += `### Module: ${req.module}\n\n`;
      markdown += `**Objective:** ${req.objective}\n\n`;
      
      if (req.features && req.features.length > 0) {
        req.features.forEach((feature) => {
          markdown += `#### Feature: ${feature.name}\n\n`;
          markdown += `**Description:** ${feature.description}\n\n`;
          
          if (feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0) {
            markdown += `**Acceptance Criteria:**\n\n`;
            markdown += `| ID | Criterion | Testable |\n`;
            markdown += `|----|-----------|----------|\n`;
            feature.acceptanceCriteria.forEach((ac) => {
              markdown += `| ${ac.id} | ${ac.description} | ${ac.testable ? "✓" : "-"} |\n`;
            });
            markdown += `\n`;
          }
        });
      }
    });
  }

  // ============================================================================
  // 14. CRITICAL USER FLOWS
  // ============================================================================
  if (prd.criticalUserFlows && prd.criticalUserFlows.length > 0) {
    markdown += `## 14. User Interaction and Design\n\n`;
    markdown += `### Critical User Flows\n\n`;
    
    prd.criticalUserFlows.forEach((flow) => {
      markdown += `#### Flow: ${flow.name}\n\n`;
      markdown += `**Role:** ${flow.role}\n\n`;
      markdown += `**Goal:** ${flow.goal}\n\n`;
      
      if (flow.steps && flow.steps.length > 0) {
        markdown += `**Steps:**\n\n`;
        flow.steps.forEach((step) => {
          markdown += `${step.stepNumber}. **${step.action}**`;
          if (step.screen) {
            markdown += ` → ${step.screen}`;
          }
          markdown += `\n`;
          if (step.systemResponse) {
            markdown += `   - System: ${step.systemResponse}\n`;
          }
          if (step.painPoint) {
            markdown += `   - Pain Point: ${step.painPoint}\n`;
          }
          markdown += `\n`;
        });
      }
    });
  }

  // ============================================================================
  // 15. TECHNICAL REQUIREMENTS
  // ============================================================================
  if (prd.technicalRequirements && prd.technicalRequirements.length > 0) {
    markdown += `## 15. Technical Requirements\n\n`;
    
    const categories = ["infrastructure", "architecture", "dataManagement", "integration"];
    categories.forEach((category) => {
      const reqs = prd.technicalRequirements!.filter(r => r.category === category);
      if (reqs.length > 0) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, " $1");
        markdown += `### ${categoryName}\n\n`;
        reqs.forEach((req) => {
          if (req.requirements && req.requirements.length > 0) {
            req.requirements.forEach((r) => {
              markdown += `- ${r}\n`;
            });
          }
          if (req.details && Object.keys(req.details).length > 0) {
            Object.entries(req.details).forEach(([key, value]) => {
              markdown += `  - ${key}: ${value}\n`;
            });
          }
        });
        markdown += `\n`;
      }
    });
  }

  // ============================================================================
  // 16. NON-FUNCTIONAL REQUIREMENTS
  // ============================================================================
  if (prd.nonFunctionalRequirements && prd.nonFunctionalRequirements.length > 0) {
    markdown += `## 16. Non-Functional Requirements (NFRs)\n\n`;
    
    const categories = ["performance", "security", "usability", "reliability", "scalability"];
    categories.forEach((category) => {
      const reqs = prd.nonFunctionalRequirements!.filter(r => r.category === category);
      if (reqs.length > 0) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        markdown += `### ${categoryName}\n\n`;
        reqs.forEach((req) => {
          if (req.requirements && req.requirements.length > 0) {
            req.requirements.forEach((r) => {
              markdown += `- ${r}\n`;
            });
          }
          if (req.metrics && Object.keys(req.metrics).length > 0) {
            markdown += `  **Metrics:**\n`;
            Object.entries(req.metrics).forEach(([key, value]) => {
              markdown += `  - ${key}: ${value}\n`;
            });
          }
        });
        markdown += `\n`;
      }
    });
  }

  // ============================================================================
  // 17. RISK MANAGEMENT
  // ============================================================================
  if (prd.riskManagement && prd.riskManagement.risks && prd.riskManagement.risks.length > 0) {
    markdown += `## 17. Risk Management\n\n`;
    
    const categories = ["operational", "technical", "security", "legal", "financial"];
    categories.forEach((category) => {
      const risks = prd.riskManagement!.risks!.filter(r => r.category === category);
      if (risks.length > 0) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        markdown += `### ${categoryName} Risks\n\n`;
        markdown += `| Risk | Probability | Impact | Mitigation Strategy |\n`;
        markdown += `|------|-------------|--------|---------------------|\n`;
        risks.forEach((risk) => {
          markdown += `| ${risk.description} | ${risk.probability} | ${risk.impact} | ${risk.mitigationStrategy || "-"} |\n`;
        });
        markdown += `\n`;
      }
    });
  }

  // ============================================================================
  // 18. OPEN QUESTIONS & DECISIONS
  // ============================================================================
  if (prd.openQuestions) {
    markdown += `## 18. Open Questions & Decisions\n\n`;
    
    if (prd.openQuestions.questions && prd.openQuestions.questions.length > 0) {
      markdown += `### Open Questions\n\n`;
      const byCategory: Record<string, typeof prd.openQuestions.questions> = {};
      prd.openQuestions.questions.forEach((q) => {
        const cat = q.category || "general";
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(q);
      });
      
      Object.entries(byCategory).forEach(([category, questions]) => {
        markdown += `#### ${category.charAt(0).toUpperCase() + category.slice(1)} Questions\n\n`;
        questions.forEach((q) => {
          markdown += `- **[${q.priority || "medium"}]** ${q.question}`;
          if (q.context) {
            markdown += `\n  - Context: ${q.context}`;
          }
          markdown += `\n`;
        });
        markdown += `\n`;
      });
    }
    
    if (prd.openQuestions.decisions && prd.openQuestions.decisions.length > 0) {
      markdown += `### Decisions\n\n`;
      prd.openQuestions.decisions.forEach((decision) => {
        markdown += `#### ${decision.decision}\n\n`;
        if (decision.rationale) {
          markdown += `**Rationale:** ${decision.rationale}\n\n`;
        }
        if (decision.date) {
          markdown += `**Date:** ${decision.date}\n\n`;
        }
      });
    }
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
      const notes = Array.isArray(prd.aiMetadata.extractionNotes) 
        ? prd.aiMetadata.extractionNotes 
        : [prd.aiMetadata.extractionNotes];
      markdown += `**Extraction Notes:** ${notes.join("; ")}\n\n`;
    }
  }

  // ============================================================================
  // CHANGE LOG
  // ============================================================================
  markdown += `---\n\n## Change Log\n\n`;
  markdown += `| Version | Date | Changes |\n`;
  markdown += `|---------|------|---------|\n`;
  markdown += `| ${prd.project?.version || "1.0.0"} | ${new Date(prd.project?.createdAt || Date.now()).toLocaleDateString()} | Initial PRD |\n`;

  return markdown;
}
