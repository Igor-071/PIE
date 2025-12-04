import { promises as fs } from "fs";
import path from "path";
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
export async function writePrdArtifacts(prd, questions, options) {
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
// ============================================================================
// HELPER FUNCTIONS FOR ENHANCED SECTIONS
// ============================================================================
function generateScreenPurpose(screenName) {
    // Generate generic, domain-agnostic purpose based on screen name
    // Relies primarily on AI-generated descriptions; these are minimal fallbacks only
    const nameLower = screenName.toLowerCase();
    // Generic UI patterns - no domain assumptions
    if (nameLower.includes('dashboard'))
        return 'Main dashboard displaying key metrics and overview';
    if (nameLower.includes('login') || nameLower.includes('auth'))
        return 'User authentication page';
    if (nameLower.includes('home') || nameLower === 'index')
        return 'Main landing page';
    if (nameLower.includes('profile'))
        return 'User profile page for viewing and editing information';
    if (nameLower.includes('schedule') || nameLower.includes('calendar'))
        return 'Calendar view for scheduling, viewing, and managing appointments';
    if (nameLower.includes('notification'))
        return 'Displays list of user notifications with read/unread status';
    if (nameLower.includes('setting'))
        return 'User settings page for managing preferences, notifications, and account settings';
    if (nameLower.includes('report') || nameLower.includes('analytics'))
        return 'Page for generating and viewing reports and analytics';
    if (nameLower.includes('inventory') || nameLower.includes('stock'))
        return 'Page for managing inventory and stock levels';
    if (nameLower.includes('detail'))
        return 'Detailed view of item information';
    if (nameLower.includes('list') || nameLower.includes('table'))
        return 'List view for browsing items';
    if (nameLower.includes('form') || nameLower.includes('create') || nameLower.includes('edit'))
        return 'Form for creating or editing items';
    if (nameLower.includes('modal') || nameLower.includes('dialog'))
        return 'Modal dialog for user interaction';
    if (nameLower.includes('search'))
        return 'Search interface for finding items';
    // Completely generic fallback - no domain context
    return 'Application screen';
}
function generateRoutePath(screenName) {
    if (!screenName || screenName === '-')
        return '-';
    const nameLower = screenName.toLowerCase().replace(/\s+/g, '-');
    return `/${nameLower}`;
}
function generateEventDescription(event) {
    if (event.description)
        return event.description;
    const handler = event.handler || event.name || '';
    if (handler.includes('login'))
        return 'User submits login form';
    if (handler.includes('signout') || handler.includes('logout'))
        return 'User clicks sign out button';
    if (handler.includes('navigate'))
        return 'User clicks navigation link';
    if (handler.includes('upload'))
        return 'User uploads a file';
    if (handler.includes('delete'))
        return 'User deletes an item';
    if (handler.includes('create') || handler.includes('add'))
        return 'User creates a new item';
    if (handler.includes('edit') || handler.includes('update'))
        return 'User edits an existing item';
    return 'User interaction event';
}
function generateDeliveryTimelineSection(timeline) {
    let markdown = `## 19. Delivery Timeline & Cost\n\n`;
    if (timeline.phases && timeline.phases.length > 0) {
        markdown += `### Development Phases\n\n`;
        timeline.phases.forEach((phase) => {
            markdown += `#### ${phase.name}\n\n`;
            markdown += `**Duration:** ${phase.duration}\n\n`;
            if (phase.teamSize) {
                markdown += `**Team Size:**\n`;
                Object.entries(phase.teamSize).forEach(([role, count]) => {
                    markdown += `- ${role}: ${count}\n`;
                });
                markdown += `\n`;
            }
            if (phase.deliverables && phase.deliverables.length > 0) {
                markdown += `**Deliverables:**\n`;
                phase.deliverables.forEach((del) => {
                    markdown += `- ${del}\n`;
                });
                markdown += `\n`;
            }
            if (phase.milestones && phase.milestones.length > 0) {
                markdown += `**Milestones:**\n`;
                phase.milestones.forEach((milestone) => {
                    markdown += `- Week ${milestone.week}: ${milestone.milestone}\n`;
                });
                markdown += `\n`;
            }
            if (phase.costEstimate) {
                markdown += `**Cost Estimate:** $${phase.costEstimate.min.toLocaleString()} - $${phase.costEstimate.max.toLocaleString()}\n\n`;
            }
        });
    }
    if (timeline.totalCost) {
        markdown += `### Total Development Cost\n\n`;
        if (timeline.totalCost.labor) {
            markdown += `**Labor Costs:** $${timeline.totalCost.labor.min.toLocaleString()} - $${timeline.totalCost.labor.max.toLocaleString()}\n\n`;
        }
    }
    return markdown;
}
function generateLaunchPlanSection(launchPlan) {
    let markdown = `## 20. Launch Plan\n\n`;
    if (launchPlan.launchStrategy) {
        markdown += `### Launch Strategy\n\n`;
        markdown += `**Approach:** ${launchPlan.launchStrategy.approach}\n\n`;
        if (launchPlan.launchStrategy.phases) {
            launchPlan.launchStrategy.phases.forEach((phase, index) => {
                markdown += `${index + 1}. **${phase.name}:** ${phase.description}\n`;
            });
            markdown += `\n`;
        }
    }
    if (launchPlan.successCriteria) {
        markdown += `### Success Criteria for Launch\n\n`;
        Object.entries(launchPlan.successCriteria).forEach(([period, criteria]) => {
            markdown += `**${period.charAt(0).toUpperCase() + period.slice(1)} Post-Launch:**\n`;
            Object.entries(criteria).forEach(([key, value]) => {
                markdown += `- ${key}: ${value}\n`;
            });
            markdown += `\n`;
        });
    }
    return markdown;
}
function generateStakeholdersRaciSection(stakeholders) {
    let markdown = `## 21. Stakeholders, Roles & RACI\n\n`;
    if (stakeholders.stakeholders && stakeholders.stakeholders.length > 0) {
        markdown += `### Stakeholder Matrix\n\n`;
        markdown += `| Stakeholder | Role | Influence | Interest | Engagement Level |\n`;
        markdown += `|-------------|------|-----------|----------|------------------|\n`;
        stakeholders.stakeholders.forEach((sh) => {
            markdown += `| ${sh.name} | ${sh.role} | ${sh.influence} | ${sh.interest} | ${sh.engagementLevel} |\n`;
        });
        markdown += `\n`;
    }
    if (stakeholders.raciChart && stakeholders.raciChart.length > 0) {
        markdown += `### RACI Chart\n\n`;
        markdown += `| Activity | Product Manager | Engineering Lead | Design Lead | Legal/Compliance | DevOps | QA | Marketing |\n`;
        markdown += `|----------|-----------------|-----------------|-------------|------------------|--------|----|-----------|\n`;
        stakeholders.raciChart.forEach((activity) => {
            const r = activity.responsible ? activity.responsible.join(", ") : "-";
            const a = activity.accountable ? activity.accountable.join(", ") : "-";
            const c = activity.consulted ? activity.consulted.join(", ") : "-";
            const i = activity.informed ? activity.informed.join(", ") : "-";
            markdown += `| ${activity.activity} | ${a} | ${r} | ${c} | ${c} | ${c} | ${r} | ${i} |\n`;
        });
        markdown += `\n`;
    }
    return markdown;
}
function generateDesignRequirementsSection(design) {
    let markdown = `## 22. Design Requirements\n\n`;
    if (design.designSystem) {
        markdown += `### Design System\n\n`;
        if (design.designSystem.componentLibrary) {
            markdown += `**Component Library:** ${design.designSystem.componentLibrary}\n\n`;
        }
        if (design.designSystem.designTokens) {
            markdown += `**Design Tokens:**\n`;
            Object.entries(design.designSystem.designTokens).forEach(([key, value]) => {
                markdown += `- ${key}: ${value}\n`;
            });
            markdown += `\n`;
        }
    }
    if (design.accessibilityRequirements) {
        markdown += `### Accessibility Requirements\n\n`;
        markdown += `**WCAG ${design.accessibilityRequirements.wcagLevel || "2.1 Level AA"} Compliance:**\n\n`;
        if (design.accessibilityRequirements.colorContrast) {
            markdown += `- **Color Contrast:** ${design.accessibilityRequirements.colorContrast}\n`;
        }
        if (design.accessibilityRequirements.keyboardNavigation) {
            markdown += `- **Keyboard Navigation:** All functionality accessible via keyboard\n`;
        }
        markdown += `\n`;
    }
    return markdown;
}
function generateEnhancedDataModelsSection(dataModel) {
    let markdown = `## 23. Data Models\n\n`;
    markdown += `### Entity Relationship Overview\n\n`;
    if (dataModel.entities) {
        Object.entries(dataModel.entities).forEach(([entityName, entity]) => {
            markdown += `#### ${entityName} Table\n\n`;
            if (entity.fields) {
                markdown += `| Field | Type | Constraints | Description |\n`;
                markdown += `|-------|------|-------------|-------------|\n`;
                Object.entries(entity.fields).forEach(([fieldName, field]) => {
                    const constraints = field.constraints ? field.constraints.join(", ") : (field.required ? "Not Null" : "Nullable");
                    const description = field.description || "-";
                    const fieldType = field.type || "string";
                    markdown += `| ${fieldName} | ${fieldType} | ${constraints} | ${description} |\n`;
                });
                markdown += `\n`;
            }
        });
    }
    return markdown;
}
function generateTestingStrategySection(testing) {
    let markdown = `## 24. Testing Strategy\n\n`;
    if (testing.testCoverageRequirements) {
        markdown += `### Test Coverage Requirements\n\n`;
        markdown += `**Target Coverage:** ${testing.testCoverageRequirements.targetCoverage || "80% code coverage for critical paths"}\n\n`;
    }
    if (testing.testingTypes && testing.testingTypes.length > 0) {
        markdown += `### Testing Types\n\n`;
        testing.testingTypes.forEach((type) => {
            markdown += `#### ${type.name}\n\n`;
            if (type.framework)
                markdown += `**Framework:** ${type.framework}\n\n`;
            if (type.scope && type.scope.length > 0) {
                markdown += `**Scope:**\n`;
                type.scope.forEach((item) => {
                    markdown += `- ${item}\n`;
                });
                markdown += `\n`;
            }
        });
    }
    return markdown;
}
function generateDeploymentStrategySection(deployment) {
    let markdown = `## 25. Deployment Strategy\n\n`;
    if (deployment.deploymentApproach) {
        markdown += `### Deployment Approach\n\n`;
        markdown += `**Strategy:** ${deployment.deploymentApproach.strategy}\n\n`;
        if (deployment.deploymentApproach.rationale) {
            markdown += `**Rationale:**\n${deployment.deploymentApproach.rationale}\n\n`;
        }
    }
    if (deployment.deploymentProcess) {
        markdown += `### Deployment Process\n\n`;
        if (deployment.deploymentProcess.deploymentSteps) {
            markdown += `#### Deployment Steps\n\n`;
            deployment.deploymentProcess.deploymentSteps.forEach((step, index) => {
                markdown += `${index + 1}. ${step}\n`;
            });
            markdown += `\n`;
        }
    }
    return markdown;
}
function generateAnalyticsMonitoringSection(analytics) {
    let markdown = `## 26. Analytics & Monitoring Requirements\n\n`;
    if (analytics.keyMetrics) {
        markdown += `### Key Metrics to Track\n\n`;
        if (analytics.keyMetrics.userMetrics && analytics.keyMetrics.userMetrics.length > 0) {
            markdown += `#### User Metrics\n`;
            analytics.keyMetrics.userMetrics.forEach((metric) => {
                markdown += `- ${metric}\n`;
            });
            markdown += `\n`;
        }
    }
    if (analytics.alertingThresholds) {
        markdown += `### Alerting Thresholds\n\n`;
        if (analytics.alertingThresholds.critical && analytics.alertingThresholds.critical.length > 0) {
            markdown += `**Critical Alerts (Immediate Notification):**\n`;
            analytics.alertingThresholds.critical.forEach((alert) => {
                markdown += `- ${alert.condition}: ${alert.notification}\n`;
            });
            markdown += `\n`;
        }
    }
    return markdown;
}
/**
 * Generates a comprehensive markdown PRD from the JSON data
 * @param prd - The complete PRD JSON data
 * @param options - Options including template path
 * @returns Promise resolving to markdown string
 */
async function generatePrdMarkdown(prd, options) {
    const projectName = prd.project?.name || options.projectName;
    let markdown = `# Product Requirements Document: ${projectName}\n\n`;
    // ============================================================================
    // DOCUMENT METADATA
    // ============================================================================
    if (prd.documentMetadata) {
        markdown += `## Document Metadata\n\n`;
        markdown += `| Field | Value |\n`;
        markdown += `|-------|-------|\n`;
        if (prd.documentMetadata.documentOwner) {
            markdown += `| Document Owner | ${prd.documentMetadata.documentOwner} |\n`;
        }
        if (prd.documentMetadata.stakeholders && prd.documentMetadata.stakeholders.length > 0) {
            markdown += `| Stakeholders | ${prd.documentMetadata.stakeholders.join(", ")} |\n`;
        }
        if (prd.documentMetadata.collaborators && prd.documentMetadata.collaborators.length > 0) {
            markdown += `| Collaborators | ${prd.documentMetadata.collaborators.join(", ")} |\n`;
        }
        if (prd.documentMetadata.referenceDocuments && prd.documentMetadata.referenceDocuments.length > 0) {
            markdown += `| Reference Documents | ${prd.documentMetadata.referenceDocuments.join(", ")} |\n`;
        }
        if (prd.documentMetadata.jiraLink) {
            markdown += `| JIRA Link | ${prd.documentMetadata.jiraLink} |\n`;
        }
        if (prd.documentMetadata.trdLink) {
            markdown += `| TRD Link | ${prd.documentMetadata.trdLink} |\n`;
        }
        markdown += `| Last Updated | ${prd.documentMetadata.lastUpdated || new Date().toLocaleDateString()} |\n`;
        markdown += `| Status | ${prd.documentMetadata.status || "Draft"} |\n\n`;
        markdown += `---\n\n`;
    }
    // ============================================================================
    // TABLE OF CONTENTS
    // ============================================================================
    markdown += `## Table of Contents\n\n`;
    markdown += `1. [Summary](#1-summary)\n`;
    markdown += `2. [Brand Foundations](#2-brand-foundations)\n`;
    markdown += `3. [Problem Statement & User Needs](#3-problem-statement--user-needs)\n`;
    markdown += `4. [Solution Overview](#4-solution-overview)\n`;
    markdown += `5. [Target Audience & Personas](#5-target-audience--personas)\n`;
    markdown += `6. [Lean Canvas](#6-lean-canvas)\n`;
    markdown += `7. [Competitive Analysis](#7-competitive-analysis)\n`;
    markdown += `8. [Goals & Success Criteria](#8-goals--success-criteria)\n`;
    markdown += `9. [MVP Scope](#9-mvp-scope)\n`;
    markdown += `10. [Assumptions](#10-assumptions)\n`;
    markdown += `11. [Dependencies](#11-dependencies)\n`;
    markdown += `12. [Role Definition / Access Model](#12-role-definition--access-model)\n`;
    markdown += `13. [Product Requirements / Acceptance Criteria](#13-product-requirements--acceptance-criteria)\n`;
    markdown += `14. [User Interaction and Design](#14-user-interaction-and-design)\n`;
    markdown += `15. [Technical Requirements](#15-technical-requirements)\n`;
    markdown += `16. [Non-Functional Requirements (NFRs)](#16-non-functional-requirements-nfrs)\n`;
    markdown += `17. [Risk Management](#17-risk-management)\n`;
    markdown += `18. [Open Questions & Decisions](#18-open-questions--decisions)\n`;
    // Add enhanced sections to TOC if they exist
    if (prd.deliveryTimeline)
        markdown += `19. [Delivery Timeline & Cost](#19-delivery-timeline--cost)\n`;
    if (prd.launchPlan)
        markdown += `20. [Launch Plan](#20-launch-plan)\n`;
    if (prd.stakeholdersAndRaci)
        markdown += `21. [Stakeholders, Roles & RACI](#21-stakeholders-roles--raci)\n`;
    if (prd.designRequirements)
        markdown += `22. [Design Requirements](#22-design-requirements)\n`;
    if (prd.dataModel)
        markdown += `23. [Data Models](#23-data-models)\n`;
    if (prd.testingStrategy)
        markdown += `24. [Testing Strategy](#24-testing-strategy)\n`;
    if (prd.deploymentStrategy)
        markdown += `25. [Deployment Strategy](#25-deployment-strategy)\n`;
    if (prd.analyticsAndMonitoring)
        markdown += `26. [Analytics & Monitoring Requirements](#26-analytics--monitoring-requirements)\n`;
    if (prd.screens && prd.screens.length > 0)
        markdown += `27. [Screens & User Interface](#27-screens--user-interface)\n`;
    if (prd.navigation && prd.navigation.length > 0)
        markdown += `28. [Navigation Structure](#28-navigation-structure)\n`;
    if (prd.api && prd.api.length > 0)
        markdown += `29. [API Endpoints](#29-api-endpoints)\n`;
    if (prd.events && prd.events.length > 0)
        markdown += `30. [User Interactions & Events](#30-user-interactions--events)\n`;
    if (prd.aiMetadata?.stackDetected && prd.aiMetadata.stackDetected.length > 0)
        markdown += `31. [Technical Stack](#31-technical-stack)\n`;
    if (prd.glossary)
        markdown += `32. [Glossary](#32-glossary)\n`;
    markdown += `33. [Change Log](#33-change-log)\n`;
    markdown += `34. [Appendix: AI Extraction Metadata](#appendix-ai-extraction-metadata)\n\n`;
    markdown += `---\n\n`;
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
            const enhancedPersona = persona;
            markdown += `### Persona ${index + 1}: ${persona.name}\n\n`;
            if (persona.demographics) {
                markdown += `**Demographics:**\n`;
                if (typeof persona.demographics === 'object') {
                    Object.entries(persona.demographics).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            markdown += `- ${key}: ${value.join(", ")}\n`;
                        }
                        else {
                            markdown += `- ${key}: ${value}\n`;
                        }
                    });
                }
                else {
                    markdown += `${persona.demographics}\n`;
                }
                markdown += `\n`;
            }
            // Enhanced persona fields
            if (enhancedPersona.techSavviness) {
                markdown += `- Tech Savviness: ${enhancedPersona.techSavviness}\n`;
            }
            if (enhancedPersona.preferredCommunicationChannels && enhancedPersona.preferredCommunicationChannels.length > 0) {
                markdown += `- Preferred Communication Channels: ${enhancedPersona.preferredCommunicationChannels.join(", ")}\n`;
            }
            markdown += `\n`;
            if (persona.goals) {
                const goals = Array.isArray(persona.goals) ? persona.goals : [persona.goals];
                markdown += `**Goals:**\n`;
                goals.forEach((goal) => {
                    markdown += `- ${goal}\n`;
                });
                markdown += `\n`;
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
            // Enhanced persona sections
            if (enhancedPersona.userScenarios && enhancedPersona.userScenarios.length > 0) {
                markdown += `**User Scenarios:**\n`;
                enhancedPersona.userScenarios.forEach((scenario, idx) => {
                    markdown += `- **Scenario ${idx + 1}:** ${scenario}\n`;
                });
                markdown += `\n`;
            }
            if (enhancedPersona.motivations && enhancedPersona.motivations.length > 0) {
                markdown += `**Motivations:**\n`;
                enhancedPersona.motivations.forEach((motivation) => {
                    markdown += `- ${motivation}\n`;
                });
                markdown += `\n`;
            }
            if (enhancedPersona.frustrations && enhancedPersona.frustrations.length > 0) {
                markdown += `**Frustrations:**\n`;
                enhancedPersona.frustrations.forEach((frustration) => {
                    markdown += `- ${frustration}\n`;
                });
                markdown += `\n`;
            }
            if (enhancedPersona.behavioralPatterns && enhancedPersona.behavioralPatterns.length > 0) {
                markdown += `**Behavioral Patterns:**\n`;
                enhancedPersona.behavioralPatterns.forEach((pattern) => {
                    markdown += `- ${pattern}\n`;
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
        }
        else {
            if (prd.competitiveAnalysis.marketCategory) {
                markdown += `### Market Category\n${prd.competitiveAnalysis.marketCategory}\n\n`;
            }
            // Enhanced competitive analysis with proper table format
            const enhancedComp = prd.competitiveAnalysis;
            if (enhancedComp.competitors && Array.isArray(enhancedComp.competitors)) {
                // Check if it's enhanced format with Competitor objects
                if (enhancedComp.competitors.length > 0 && typeof enhancedComp.competitors[0] === 'object' && enhancedComp.competitors[0].name) {
                    markdown += `### Competitors\n\n`;
                    markdown += `| Competitor Name | Strengths | Weaknesses | Market Position | Key Differentiators |\n`;
                    markdown += `|----------------|-----------|------------|-----------------|---------------------|\n`;
                    enhancedComp.competitors.forEach((comp) => {
                        const strengths = comp.strengths ? comp.strengths.join(", ") : "-";
                        const weaknesses = comp.weaknesses ? comp.weaknesses.join(", ") : "-";
                        const marketPosition = comp.marketPosition || "-";
                        const differentiators = comp.keyDifferentiators ? comp.keyDifferentiators.join(", ") : "-";
                        markdown += `| ${comp.name} | ${strengths} | ${weaknesses} | ${marketPosition} | ${differentiators} |\n`;
                    });
                    markdown += `\n`;
                }
                else {
                    // Legacy format - simple list
                    markdown += `### Competitors\n`;
                    enhancedComp.competitors.forEach((comp) => {
                        markdown += `- ${comp}\n`;
                    });
                    markdown += `\n`;
                }
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
            // Check if enhanced format (with baseline, owner, etc.)
            const firstMetric = prd.goalsAndSuccessCriteria.successMetrics[0];
            if (firstMetric.baseline || firstMetric.owner) {
                // Enhanced format
                markdown += `| Metric | Description | Baseline | Target | Measurement Method | Data Source | Owner | Measurement Frequency | Review Cadence |\n`;
                markdown += `|--------|-------------|----------|--------|---------------------|-------------|-------|----------------------|---------------|\n`;
                prd.goalsAndSuccessCriteria.successMetrics.forEach((metric) => {
                    markdown += `| ${metric.name} | ${metric.description} | ${metric.baseline || "-"} | ${metric.target || "-"} | ${metric.measurementMethod || "-"} | ${metric.dataSource || "-"} | ${metric.owner || "-"} | ${metric.measurementFrequency || "-"} | ${metric.reviewCadence || "-"} |\n`;
                });
            }
            else {
                // Standard format
                markdown += `| Metric | Description | Target | Measurement Method |\n`;
                markdown += `|--------|-------------|--------|---------------------|\n`;
                prd.goalsAndSuccessCriteria.successMetrics.forEach((metric) => {
                    markdown += `| ${metric.name} | ${metric.description} | ${metric.target || "-"} | ${metric.measurementMethod || "-"} |\n`;
                });
            }
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
                const enhancedDep = dep;
                markdown += `#### ${dep.name}\n\n`;
                markdown += `**Description:** ${dep.description}\n\n`;
                if (dep.impact) {
                    markdown += `**Impact:** ${dep.impact}\n\n`;
                }
                // Enhanced dependency fields
                if (enhancedDep.slaRequirements) {
                    markdown += `**SLA Requirements:**\n${enhancedDep.slaRequirements}\n\n`;
                }
                if (enhancedDep.versionConstraints) {
                    markdown += `**Version Constraints:**\n${enhancedDep.versionConstraints}\n\n`;
                }
                if (enhancedDep.fallbackOptions && enhancedDep.fallbackOptions.length > 0) {
                    markdown += `**Fallback Options:**\n`;
                    enhancedDep.fallbackOptions.forEach((option) => {
                        markdown += `- ${option}\n`;
                    });
                    markdown += `\n`;
                }
                if (enhancedDep.supportContact) {
                    markdown += `**Support Contact:** ${enhancedDep.supportContact}\n\n`;
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
            const roleColumns = new Set();
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
                const feature = matrix.feature || "-";
                const cells = roleHeaders.map((role) => matrix[role] || "-");
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
                        // Check if enhanced format
                        const firstAc = feature.acceptanceCriteria[0];
                        if (firstAc.edgeCases || firstAc.errorScenarios || firstAc.validationRules) {
                            // Enhanced format - show all criteria with details
                            markdown += `| ID | Criterion | Testable |\n`;
                            markdown += `|----|-----------|----------|\n`;
                            feature.acceptanceCriteria.forEach((ac) => {
                                markdown += `| ${ac.id} | ${ac.description} | ${ac.testable ? "✓" : "-"} |\n`;
                                // Add enhanced details as sub-items
                                if (ac.edgeCases && ac.edgeCases.length > 0) {
                                    ac.edgeCases.forEach((edgeCase) => {
                                        markdown += `| ${ac.id}a | ${edgeCase} | ✓ |\n`;
                                    });
                                }
                                if (ac.errorScenarios && ac.errorScenarios.length > 0) {
                                    ac.errorScenarios.forEach((error) => {
                                        markdown += `| ${ac.id}b | ${error} | ✓ |\n`;
                                    });
                                }
                                if (ac.validationRules && ac.validationRules.length > 0) {
                                    ac.validationRules.forEach((rule) => {
                                        markdown += `| ${ac.id}c | ${rule} | ✓ |\n`;
                                    });
                                }
                            });
                        }
                        else {
                            // Standard format
                            markdown += `| ID | Criterion | Testable |\n`;
                            markdown += `|----|-----------|----------|\n`;
                            feature.acceptanceCriteria.forEach((ac) => {
                                markdown += `| ${ac.id} | ${ac.description} | ${ac.testable ? "✓" : "-"} |\n`;
                            });
                        }
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
            const enhancedFlow = flow;
            markdown += `#### Flow: ${flow.name}\n\n`;
            markdown += `**Role:** ${flow.role}\n\n`;
            markdown += `**Goal:** ${flow.goal}\n\n`;
            if (flow.steps && flow.steps.length > 0) {
                markdown += `**Primary Path:**\n\n`;
                flow.steps.forEach((step) => {
                    markdown += `${step.stepNumber}. **${step.action}**`;
                    if (step.screen) {
                        markdown += ` → ${step.screen}`;
                    }
                    markdown += `\n`;
                    if (step.systemResponse) {
                        markdown += `   - System: ${step.systemResponse}\n`;
                    }
                    if (step.loadingState) {
                        markdown += `   - Loading State: ${step.loadingState}\n`;
                    }
                    if (step.successState) {
                        markdown += `   - Success State: ${step.successState}\n`;
                    }
                    if (step.errorState) {
                        markdown += `   - Error State: ${step.errorState}\n`;
                    }
                    if (step.painPoint) {
                        markdown += `   - Pain Point: ${step.painPoint}\n`;
                    }
                    markdown += `\n`;
                });
            }
            // Enhanced flow sections
            if (enhancedFlow.alternativePaths && enhancedFlow.alternativePaths.length > 0) {
                markdown += `**Alternative Paths:**\n\n`;
                enhancedFlow.alternativePaths.forEach((altPath) => {
                    markdown += `- **${altPath.name}:**\n`;
                    if (altPath.steps && altPath.steps.length > 0) {
                        altPath.steps.forEach((step, idx) => {
                            markdown += `  ${idx + 1}. ${step.action}\n`;
                        });
                    }
                    markdown += `\n`;
                });
            }
            if (enhancedFlow.errorScenarios && enhancedFlow.errorScenarios.length > 0) {
                markdown += `**Error Scenarios:**\n\n`;
                enhancedFlow.errorScenarios.forEach((error) => {
                    markdown += `- **${error.scenario}:** ${error.handling}\n`;
                });
                markdown += `\n`;
            }
            if (enhancedFlow.edgeCases && enhancedFlow.edgeCases.length > 0) {
                markdown += `**Edge Cases:**\n\n`;
                enhancedFlow.edgeCases.forEach((edgeCase) => {
                    markdown += `- ${edgeCase}\n`;
                });
                markdown += `\n`;
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
            const reqs = prd.technicalRequirements.filter(r => r.category === category);
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
            const reqs = prd.nonFunctionalRequirements.filter(r => r.category === category);
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
            const risks = prd.riskManagement.risks.filter(r => r.category === category);
            if (risks.length > 0) {
                const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                markdown += `### ${categoryName} Risks\n\n`;
                // Check if enhanced format
                const firstRisk = risks[0];
                if (firstRisk.riskOwner || firstRisk.contingencyPlan) {
                    // Enhanced format
                    markdown += `| Risk | Probability | Impact | Risk Owner | Mitigation Strategy | Contingency Plan | Monitoring Indicators | Review Frequency |\n`;
                    markdown += `|------|-------------|--------|------------|---------------------|------------------|---------------------|-----------------|\n`;
                    risks.forEach((risk) => {
                        markdown += `| ${risk.description} | ${risk.probability} | ${risk.impact} | ${risk.riskOwner || "-"} | ${risk.mitigationStrategy || "-"} | ${risk.contingencyPlan || "-"} | ${risk.monitoringIndicators ? risk.monitoringIndicators.join(", ") : "-"} | ${risk.reviewFrequency || "-"} |\n`;
                    });
                }
                else {
                    // Standard format
                    markdown += `| Risk | Probability | Impact | Mitigation Strategy |\n`;
                    markdown += `|------|-------------|--------|---------------------|\n`;
                    risks.forEach((risk) => {
                        markdown += `| ${risk.description} | ${risk.probability} | ${risk.impact} | ${risk.mitigationStrategy || "-"} |\n`;
                    });
                }
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
            const byCategory = {};
            prd.openQuestions.questions.forEach((q) => {
                const cat = q.category || "general";
                if (!byCategory[cat])
                    byCategory[cat] = [];
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
    // 19-26. ENHANCED SECTIONS (if present)
    // ============================================================================
    // 19. Delivery Timeline & Cost
    if (prd.deliveryTimeline) {
        markdown += generateDeliveryTimelineSection(prd.deliveryTimeline);
    }
    // 20. Launch Plan
    if (prd.launchPlan) {
        markdown += generateLaunchPlanSection(prd.launchPlan);
    }
    // 21. Stakeholders & RACI
    if (prd.stakeholdersAndRaci) {
        markdown += generateStakeholdersRaciSection(prd.stakeholdersAndRaci);
    }
    // 22. Design Requirements
    if (prd.designRequirements) {
        markdown += generateDesignRequirementsSection(prd.designRequirements);
    }
    // 23. Data Models (Enhanced)
    if (prd.dataModel && Object.keys(prd.dataModel).length > 0) {
        const enhancedDataModel = prd.dataModel;
        if (enhancedDataModel.entities) {
            markdown += generateEnhancedDataModelsSection(enhancedDataModel);
        }
        else {
            // Legacy format
            markdown += `## 23. Data Models\n\n`;
            Object.entries(prd.dataModel).forEach(([entityName, entity]) => {
                markdown += `### ${entityName}\n\n`;
                if (entity.fields && Object.keys(entity.fields).length > 0) {
                    markdown += `| Field | Type | Required |\n`;
                    markdown += `|-------|------|----------|\n`;
                    Object.entries(entity.fields).forEach(([fieldName, field]) => {
                        const fieldType = field.type || "string";
                        const fieldRequired = field.required ? "✓" : "-";
                        markdown += `| ${fieldName} | ${fieldType} | ${fieldRequired} |\n`;
                    });
                    markdown += `\n`;
                }
            });
        }
    }
    // 24. Testing Strategy
    if (prd.testingStrategy) {
        markdown += generateTestingStrategySection(prd.testingStrategy);
    }
    // 25. Deployment Strategy
    if (prd.deploymentStrategy) {
        markdown += generateDeploymentStrategySection(prd.deploymentStrategy);
    }
    // 26. Analytics & Monitoring
    if (prd.analyticsAndMonitoring) {
        markdown += generateAnalyticsMonitoringSection(prd.analyticsAndMonitoring);
    }
    // ============================================================================
    // 27. SCREENS & USER INTERFACE
    // ============================================================================
    if (prd.screens && prd.screens.length > 0) {
        markdown += `## 27. Screens & User Interface\n\n`;
        markdown += `The application consists of ${prd.screens.length} screens:\n\n`;
        markdown += `| Screen Name | Purpose | Path |\n`;
        markdown += `|-------------|---------|------|\n`;
        prd.screens.forEach((screen) => {
            // Generate purpose if missing
            const purpose = screen.purpose || generateScreenPurpose(screen.name);
            markdown += `| ${screen.name} | ${purpose} | \`${screen.path || "-"}\` |\n`;
        });
        markdown += `\n`;
    }
    // ============================================================================
    // 28. NAVIGATION STRUCTURE
    // ============================================================================
    if (prd.navigation && prd.navigation.length > 0) {
        markdown += `## 28. Navigation Structure\n\n`;
        markdown += `The application has ${prd.navigation.length} navigation routes:\n\n`;
        markdown += `| From Screen | To Screen | Route Path | Event/Label | Access Control |\n`;
        markdown += `|-------------|-----------|------------|-------------|----------------|\n`;
        prd.navigation.forEach((nav) => {
            const fromScreen = nav.fromScreenId || "-";
            const toScreen = nav.toScreenId || "-";
            const routePath = nav.path || generateRoutePath(toScreen);
            const event = nav.event || nav.label || "-";
            markdown += `| ${fromScreen} | ${toScreen} | \`${routePath}\` | ${event} | - |\n`;
        });
        markdown += `\n`;
    }
    // ============================================================================
    // 29. API ENDPOINTS
    // ============================================================================
    if (prd.api && prd.api.length > 0) {
        markdown += `## 29. API Endpoints\n\n`;
        // Check if we have detailed API info
        const firstEndpoint = prd.api[0];
        if (firstEndpoint.description || firstEndpoint.authRequired !== undefined) {
            markdown += `### REST API Endpoints\n\n`;
            markdown += `| Method | Endpoint | Name | Description | Authentication | Request Body | Response |\n`;
            markdown += `|--------|----------|------|-------------|---------------|--------------|----------|\n`;
            prd.api.forEach((endpoint) => {
                markdown += `| ${endpoint.method || "-"} | \`${endpoint.endpoint}\` | ${endpoint.name || "-"} | ${endpoint.description || "-"} | ${endpoint.authRequired ? "Bearer Token" : "None"} | ${endpoint.payloadFields ? JSON.stringify(endpoint.payloadFields) : "-"} | ${endpoint.responseFields ? JSON.stringify(endpoint.responseFields) : "-"} |\n`;
            });
        }
        else {
            markdown += `| Method | Endpoint | Name | Handler |\n`;
            markdown += `|--------|----------|------|----------|\n`;
            prd.api.forEach((endpoint) => {
                markdown += `| ${endpoint.method || "-"} | \`${endpoint.endpoint}\` | ${endpoint.name || "-"} | \`${endpoint.handler || "-"}\` |\n`;
            });
        }
        markdown += `\n`;
    }
    // ============================================================================
    // 30. EVENTS & USER INTERACTIONS
    // ============================================================================
    if (prd.events && prd.events.length > 0) {
        markdown += `## 30. User Interactions & Events\n\n`;
        markdown += `The application handles ${prd.events.length} user interaction events. Below is a comprehensive list of all events with descriptions, triggers, and outcomes.\n\n`;
        // Group events by type
        const eventsByType = {};
        prd.events.forEach((event) => {
            const type = event.type || "other";
            if (!eventsByType[type]) {
                eventsByType[type] = [];
            }
            eventsByType[type].push(event);
        });
        Object.entries(eventsByType).forEach(([type, events]) => {
            const typeName = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
            markdown += `### ${typeName} Events\n\n`;
            markdown += `| Event Type | Handler/Function | Description | Trigger | Outcome |\n`;
            markdown += `|------------|------------------|-------------|---------|----------|\n`;
            events.forEach((event) => {
                const eventType = event.type || "onClick";
                const handler = event.handler || event.name || "-";
                const description = generateEventDescription(event);
                const trigger = event.trigger || "-";
                const outcome = event.outputs ? event.outputs.join(", ") : "-";
                markdown += `| ${eventType} | ${handler} | ${description} | ${trigger} | ${outcome} |\n`;
            });
            markdown += `\n`;
        });
    }
    // ============================================================================
    // 31. TECHNICAL STACK
    // ============================================================================
    if (prd.aiMetadata?.stackDetected && prd.aiMetadata.stackDetected.length > 0) {
        markdown += `## 31. Technical Stack\n\n`;
        markdown += `### Frontend\n\n`;
        markdown += `- **Framework:** ${prd.aiMetadata.stackDetected.find(s => s.toLowerCase().includes('next') || s.toLowerCase().includes('react')) || "Not specified"}\n`;
        markdown += `- **Language:** TypeScript\n`;
        markdown += `- **UI Library:** React\n\n`;
        markdown += `### Backend\n\n`;
        markdown += `- **Runtime:** Node.js\n`;
        markdown += `- **Database:** PostgreSQL (via Supabase)\n\n`;
        markdown += `### Infrastructure\n\n`;
        markdown += `- **Hosting:** Cloud provider (AWS/Azure/GCP)\n`;
        markdown += `- **CDN:** Cloudflare/AWS CloudFront\n\n`;
    }
    // ============================================================================
    // 32. GLOSSARY
    // ============================================================================
    if (prd.glossary && prd.glossary.terms && prd.glossary.terms.length > 0) {
        markdown += `## 32. Glossary\n\n`;
        markdown += `### Terms and Definitions\n\n`;
        prd.glossary.terms.forEach((term) => {
            markdown += `**${term.term}:** ${term.definition}\n\n`;
        });
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
    markdown += `---\n\n## 33. Change Log\n\n`;
    markdown += `| Version | Date | Changes | Author |\n`;
    markdown += `|---------|------|---------|--------|\n`;
    markdown += `| ${prd.project?.version || "1.0.0"} | ${new Date(prd.project?.createdAt || Date.now()).toLocaleDateString()} | Initial PRD | Product Team |\n`;
    return markdown;
}
//# sourceMappingURL=prdGenerator.js.map