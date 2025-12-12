import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
/**
 * Helper function to safely convert a value to an array
 * Handles cases where AI returns a string instead of an array
 */
function ensureArray(value) {
    if (!value)
        return [];
    if (Array.isArray(value))
        return value;
    if (typeof value === 'string') {
        // Split by common delimiters
        return value.split(/[,;]\s*/).filter((s) => s.trim().length > 0);
    }
    return [String(value)];
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
    const markdownContent = await generatePrdMarkdown(prd, options, questions);
    const projectNameForFile = prd.project?.name || options.projectName;
    const sanitizedProjectName = projectNameForFile
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    const markdownFilename = `PRD_${sanitizedProjectName}.md`;
    const markdownPath = path.join(options.outputDir, markdownFilename);
    await fs.writeFile(markdownPath, markdownContent, "utf-8");
    // Write candidate contract artifacts (best-effort)
    await writeCandidateContractArtifacts(prd, options.outputDir).catch((err) => {
        console.warn("[prdGenerator] Failed to write contract artifacts:", err);
    });
    console.log(`PRD written to: ${markdownPath}`);
    console.log(`Structured JSON written to: ${jsonPath}`);
    console.log(`Questions written to: ${questionsPath}`);
    return { markdownFilename };
}
async function writeCandidateContractArtifacts(prd, outputDir) {
    const contractsDir = path.join(outputDir, "contracts");
    await fs.mkdir(contractsDir, { recursive: true });
    // 1) OpenAPI candidate (JSON)
    const openApi = generateOpenApiCandidate(prd);
    await fs.writeFile(path.join(contractsDir, "openapi.candidate.json"), JSON.stringify(openApi, null, 2), "utf-8");
    // 2) RBAC candidate
    const rbac = generateRbacCandidate(prd);
    await fs.writeFile(path.join(contractsDir, "rbac.candidate.json"), JSON.stringify(rbac, null, 2), "utf-8");
    // 3) JSON Schemas from data model
    const schemasDir = path.join(contractsDir, "schemas");
    await fs.mkdir(schemasDir, { recursive: true });
    const schemas = generateDataModelSchemas(prd);
    for (const [name, schema] of Object.entries(schemas)) {
        await fs.writeFile(path.join(schemasDir, `${sanitizeFileSegment(name)}.schema.json`), JSON.stringify(schema, null, 2), "utf-8");
    }
    // 4) Contract gaps
    const gaps = generateContractGaps(prd, openApi, rbac, schemas);
    await fs.writeFile(path.join(contractsDir, "CONTRACT_GAPS.md"), gaps, "utf-8");
}
function sanitizeFileSegment(input) {
    return input.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "unknown";
}
function generateOpenApiCandidate(prd) {
    const title = prd.project?.name || "API";
    const version = prd.project?.version || "1.0.0";
    const paths = {};
    (prd.api || []).forEach((ep) => {
        const method = (ep.method || "GET").toLowerCase();
        const route = ep.endpoint || ep.name;
        if (!route)
            return;
        if (!paths[route])
            paths[route] = {};
        paths[route][method] = {
            summary: ep.name || `${ep.method} ${ep.endpoint}`,
            description: ep.description || "TBD",
            security: ep.authRequired ? [{ bearerAuth: [] }] : [],
            requestBody: ep.payloadFields
                ? {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { type: "object", properties: Object.fromEntries(ep.payloadFields.map((f) => [f, { type: "string" }])) },
                        },
                    },
                }
                : undefined,
            responses: {
                "200": {
                    description: "TBD",
                    content: {
                        "application/json": {
                            schema: ep.responseFields
                                ? { type: "object", properties: Object.fromEntries(ep.responseFields.map((f) => [f, { type: "string" }])) }
                                : { type: "object" },
                        },
                    },
                },
            },
        };
    });
    return {
        openapi: "3.0.0",
        info: { title, version },
        paths,
        components: {
            securitySchemes: {
                bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            },
        },
    };
}
function generateRbacCandidate(prd) {
    const roles = prd.roleDefinition?.roles || [];
    const accessMatrix = prd.roleDefinition?.accessMatrix || [];
    return {
        roles,
        accessMatrix,
    };
}
function generateDataModelSchemas(prd) {
    const schemas = {};
    const dm = prd.dataModel;
    if (!dm)
        return schemas;
    const entities = dm.entities ? dm.entities : dm; // enhanced vs legacy
    for (const [entityName, entity] of Object.entries(entities || {})) {
        const fields = entity.fields || {};
        const required = [];
        const properties = {};
        for (const [fieldName, field] of Object.entries(fields)) {
            const type = mapToJsonSchemaType(field.type);
            properties[fieldName] = { type };
            if (field.description)
                properties[fieldName].description = field.description;
            if (field.required)
                required.push(fieldName);
        }
        schemas[entityName] = {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            title: entityName,
            type: "object",
            additionalProperties: false,
            properties,
            required: required.length ? required : undefined,
        };
    }
    return schemas;
}
function mapToJsonSchemaType(type) {
    const t = (type || "string").toLowerCase();
    if (t.includes("int") || t === "number" || t === "float" || t === "double")
        return "number";
    if (t === "boolean" || t === "bool")
        return "boolean";
    if (t === "array" || t.endsWith("[]"))
        return "array";
    if (t === "object" || t === "json")
        return "object";
    return "string";
}
function generateContractGaps(prd, openApi, rbac, schemas) {
    const gaps = [];
    if (!prd.api || prd.api.length === 0)
        gaps.push("- No API endpoints detected in PRD JSON.");
    if (prd.api?.some((e) => !e.payloadFields && !e.responseFields))
        gaps.push("- Some endpoints are missing request/response field definitions (candidate OpenAPI uses placeholders).");
    if (!prd.roleDefinition?.roles?.length)
        gaps.push("- No roles defined; RBAC contract is incomplete.");
    if (!prd.roleDefinition?.accessMatrix?.length)
        gaps.push("- No access matrix defined; RBAC permissions are incomplete.");
    if (!Object.keys(schemas).length)
        gaps.push("- No data models available; schema contracts were not generated.");
    const title = prd.project?.name || "Project";
    return [
        `# Contract Gaps for ${title}`,
        "",
        "This file lists missing or inferred contract details that should be confirmed for implementation.",
        "",
        gaps.length ? gaps.join("\n") : "- No obvious gaps detected (best-effort).",
        "",
        "## Generated files",
        "",
        "- `openapi.candidate.json`",
        "- `rbac.candidate.json`",
        "- `schemas/*.schema.json`",
        "",
    ].join("\n");
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
 * Strips HTML comments from template content
 * @param content - Template content with HTML comments
 * @returns Content with HTML comments removed
 */
function stripHtmlComments(content) {
    // Remove HTML comments (<!-- ... -->) including multi-line ones
    return content.replace(/<!--[\s\S]*?-->/g, "");
}
/**
 * Generates a comprehensive markdown PRD from the JSON data
 * @param prd - The complete PRD JSON data
 * @param options - Options including template path and instruction inclusion
 * @param questions - Questions for client (used for open questions section)
 * @returns Promise resolving to markdown string
 */
async function generatePrdMarkdown(prd, options, questions) {
    let template = await loadPrdTemplate(options.templatePath);
    // Strip HTML comments if not including template instructions
    if (!options.includeTemplateInstructions) {
        template = stripHtmlComments(template);
    }
    const projectName = prd.project?.name || options.projectName || "Project";
    const doc = prd.documentMetadata || {};
    const isGoldTemplate = template.includes("## 0. Document Metadata") || template.includes("Gold Standard Product Requirements Document");
    // Use gold template variables if gold template detected, otherwise use legacy
    const vars = isGoldTemplate
        ? buildGoldTemplateVars(prd, options, questions)
        : buildLegacyTemplateVars(prd, options);
    return renderTemplate(template, vars);
}
/**
 * Builds variables for gold standard template
 */
function buildGoldTemplateVars(prd, options, questions) {
    const projectName = prd.project?.name || options.projectName || "Project";
    const doc = prd.documentMetadata || {};
    const lastUpdated = doc.lastUpdated || new Date().toLocaleDateString();
    const sourceInputs = prd.aiMetadata?.extractionNotes
        ? (Array.isArray(prd.aiMetadata.extractionNotes)
            ? prd.aiMetadata.extractionNotes.join(", ")
            : prd.aiMetadata.extractionNotes)
        : "Git Repo / ZIP / URLs";
    return {
        // 0. Document Metadata
        productName: projectName,
        prdVersion: prd.project?.version || "1.0.0",
        status: doc.status || "Draft",
        documentOwner: doc.documentOwner || "TBD",
        stakeholders: doc.stakeholders?.length ? doc.stakeholders.join(", ") : "TBD",
        sourceInputs,
        lastUpdated,
        linkedArtifacts: [
            doc.trdLink ? "TRD" : null,
            doc.jiraLink ? "Jira" : null,
            doc.referenceDocuments?.length ? "Reference Documents" : null,
        ].filter(Boolean).join(", ") || "TBD",
        // 1. Executive Summary
        executiveSummary: renderExecutiveSummary(prd),
        // 2. Brand & Product Foundations
        brandFoundations: renderBrandFoundations(prd),
        // 3.1 Primary Problem
        primaryProblem: renderPrimaryProblem(prd),
        // 4. User & Stakeholder Landscape
        primaryPersonas: renderPrimaryPersonas(prd),
        secondaryPersonas: renderSecondaryPersonas(prd),
        internalStakeholders: renderInternalStakeholders(prd),
        // 5. Value Proposition & Solution Overview
        valueProposition: renderValueProposition(prd),
        // 6. Strategic Model
        strategicModel: renderStrategicModel(prd),
        // 7. Goals, Success Metrics & KPIs
        productGoals: renderProductGoals(prd),
        successMetrics: renderSuccessMetrics(prd),
        // 8. Scope Definition
        mvpInScope: renderMvpInScope(prd),
        mvpOutOfScope: renderMvpOutOfScope(prd),
        // 9. Functional Requirements & Acceptance Criteria
        functionalRequirements: renderFunctionalRequirements(prd),
        // 10. User Experience & Interaction Design
        keyUserFlows: renderKeyUserFlows(prd),
        navigationArchitecture: renderNavigationArchitecture(prd),
        // 11. Data & Domain Model
        dataDomainModel: renderDataDomainModel(prd),
        // 12. Technical Constraints & Architecture
        technicalConstraints: renderTechnicalConstraints(prd),
        // 13. Non-Functional Requirements
        nonFunctionalRequirements: renderNonFunctionalRequirementsGold(prd),
        // 14. Dependencies & Assumptions
        dependencies: renderDependenciesGold(prd),
        assumptions: renderAssumptionsGold(prd),
        // 15. Risk Management
        riskManagement: renderRiskManagementGold(prd),
        // 16. Delivery Plan & Cost
        deliveryPlan: renderDeliveryPlan(prd),
        // 17. Launch & Rollout Plan
        launchPlan: renderLaunchPlanGold(prd),
        // 18. Open Questions & Decisions Log
        openQuestions: renderOpenQuestionsGold(prd, questions),
        // 19. Change Log
        changeLog: renderChangeLog(prd),
        // 20. Appendix
        appendix: renderAppendixGold(prd),
    };
}
/**
 * Builds variables for legacy template (backwards compatibility)
 */
function buildLegacyTemplateVars(prd, options) {
    const projectName = prd.project?.name || options.projectName || "Project";
    const doc = prd.documentMetadata || {};
    return {
        projectName,
        documentOwner: doc.documentOwner || "TBD",
        stakeholders: doc.stakeholders?.length ? doc.stakeholders.join(", ") : "TBD",
        collaborators: doc.collaborators?.length ? doc.collaborators.join(", ") : "TBD",
        referenceDocuments: doc.referenceDocuments?.length ? doc.referenceDocuments.join(", ") : "TBD",
        jiraLink: doc.jiraLink || "TBD",
        trdLink: doc.trdLink || "TBD",
        tableOfContents: renderArcaStyleToc(),
        summary: renderSummary(prd),
        problemStatementAndOutcomes: renderProblemStatementAndOutcomes(prd),
        goalsAndSuccessCriteria: renderGoalsAndSuccessCriteria(prd),
        mvpScope: renderMvpScope(prd),
        targetAudience: renderTargetAudience(prd),
        assumptions: renderAssumptions(prd),
        dependencies: renderDependencies(prd),
        roleDefinition: renderRoleDefinition(prd),
        productRequirements: renderProductRequirementsTable(prd),
        dependencyMapping: renderDependencyMapping(prd),
        userInteractionAndDesign: renderUserInteractionAndDesign(prd),
        technicalRequirements: renderTechnicalRequirements(prd),
        nonFunctionalRequirements: renderNonFunctionalRequirements(prd),
        riskManagement: renderRiskManagement(prd),
        deliveryTimelineAndCost: renderDeliveryTimelineAndCost(prd),
        launchPlan: renderLaunchPlan(prd),
        stakeholdersRaci: renderStakeholdersRaci(prd),
        openQuestionsAndDecisions: renderOpenQuestionsAndDecisions(prd),
        changeLog: renderChangeLog(prd),
        appendix: renderAppendix(prd),
    };
}
async function loadPrdTemplate(templatePath) {
    const candidates = [];
    if (templatePath)
        candidates.push(templatePath);
    // Gold standard template is the default - search for it first
    // Common runtime contexts:
    // - CLI: cwd = repo root
    // - Web: cwd = <repo>/web
    candidates.push(path.resolve(process.cwd(), "templates", "PRD_GOLD_STANDARD.md"));
    candidates.push(path.resolve(process.cwd(), "..", "templates", "PRD_GOLD_STANDARD.md"));
    // Try relative to this module's location (dist or web/lib/pie-core)
    try {
        const moduleDir = path.dirname(fileURLToPath(import.meta.url));
        candidates.push(path.resolve(moduleDir, "..", "..", "templates", "PRD_GOLD_STANDARD.md"));
        candidates.push(path.resolve(moduleDir, "..", "..", "..", "templates", "PRD_GOLD_STANDARD.md"));
        candidates.push(path.resolve(moduleDir, "..", "..", "..", "..", "templates", "PRD_GOLD_STANDARD.md"));
    }
    catch {
        // ignore
    }
    // Fallback to legacy template if gold standard not found
    candidates.push(path.resolve(process.cwd(), "templates", "PRD_Template.md"));
    candidates.push(path.resolve(process.cwd(), "..", "templates", "PRD_Template.md"));
    try {
        const moduleDir = path.dirname(fileURLToPath(import.meta.url));
        candidates.push(path.resolve(moduleDir, "..", "..", "templates", "PRD_Template.md"));
        candidates.push(path.resolve(moduleDir, "..", "..", "..", "templates", "PRD_Template.md"));
        candidates.push(path.resolve(moduleDir, "..", "..", "..", "..", "templates", "PRD_Template.md"));
    }
    catch {
        // ignore
    }
    for (const candidate of candidates) {
        try {
            const content = await fs.readFile(candidate, "utf-8");
            if (content.trim().length > 0)
                return content;
        }
        catch {
            continue;
        }
    }
    // Last-resort fallback: minimal inline template.
    return `# {{projectName}} PRD

| **Document owner** | {{documentOwner}} |
| --- | --- |
| **Stakeholders / Client** | {{stakeholders}} |
| **Collaborators / Consulted (Discovery and Design)** | {{collaborators}} |
| **Reference documents** | {{referenceDocuments}} |
| **Jira** | {{jiraLink}} |
| **Technical Requirements Document** | {{trdLink}} |

{{tableOfContents}}

### **Summary**

{{summary}}

### **Problem Statement & Outcomes**

{{problemStatementAndOutcomes}}

### **Goals & Success Criteria**

{{goalsAndSuccessCriteria}}

### **MVP Scope**

{{mvpScope}}

### **Target Audience / Personas**

{{targetAudience}}

### **Assumptions**

{{assumptions}}

### **Dependencies**

{{dependencies}}

### **Role Definition / Access Model**

{{roleDefinition}}

### **Product Requirements / Acceptance Criteria**

{{productRequirements}}

#### Dependency mapping

{{dependencyMapping}}

### **User Interaction and Design**

{{userInteractionAndDesign}}

### **Technical Requirements**

{{technicalRequirements}}

### **Non-Functional Requirements**

{{nonFunctionalRequirements}}

### **Risk Management**

{{riskManagement}}

### **Delivery timeline & cost**

{{deliveryTimelineAndCost}}

### **Launch Plan**

{{launchPlan}}

### **Stakeholders, Roles & RACI**

{{stakeholdersRaci}}

### **Open Questions & Decisions**

{{openQuestionsAndDecisions}}

### **Change log**

{{changeLog}}

### **Appendix**

{{appendix}}
`;
}
function renderTemplate(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (Object.prototype.hasOwnProperty.call(vars, key)) {
            return vars[key] ?? "";
        }
        return "";
    });
}
// ============================================================================
// GOLD TEMPLATE RENDER FUNCTIONS
// ============================================================================
function renderExecutiveSummary(prd) {
    const overview = prd.executiveSummary?.overview || prd.solutionOverview?.valueProposition;
    const highlights = prd.executiveSummary?.solutionHighlights;
    if (overview) {
        return highlights ? `${overview}\n\n${highlights}` : overview;
    }
    return "TBD";
}
function renderBrandFoundations(prd) {
    const bf = prd.brandFoundations;
    if (!bf)
        return "TBD";
    const parts = [];
    if (bf.mission)
        parts.push(`- **Mission:** ${bf.mission}`);
    if (bf.vision)
        parts.push(`- **Vision:** ${bf.vision}`);
    if (bf.brandPromise)
        parts.push(`- **Product Promise:** ${bf.brandPromise}`);
    const coreValues = ensureArray(bf.coreValues);
    if (coreValues.length) {
        parts.push(`- **Core Values:** ${coreValues.join(", ")}`);
    }
    if (bf.toneOfVoice) {
        // Handle both array and string cases (AI sometimes returns string instead of array)
        const toneOfVoiceText = Array.isArray(bf.toneOfVoice)
            ? bf.toneOfVoice.join(", ")
            : bf.toneOfVoice;
        parts.push(`- **Tone of Voice:** ${toneOfVoiceText}`);
    }
    if (bf.brandEthos) {
        parts.push(`- **What This Product Is Not:** ${bf.brandEthos}`);
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderPrimaryProblem(prd) {
    const pd = prd.problemDefinition;
    if (!pd?.primaryProblem)
        return "TBD";
    const parts = [pd.primaryProblem];
    if (pd.context)
        parts.push(`\n**Context:** ${pd.context}`);
    if (pd.businessImpact)
        parts.push(`\n**Business Impact:** ${pd.businessImpact}`);
    if (pd.outcomes) {
        parts.push(`\n**Expected Outcomes:**`);
        // Handle both array and string cases (AI sometimes returns string instead of array)
        if (Array.isArray(pd.outcomes)) {
            parts.push(...pd.outcomes.map((o) => `- ${o}`));
        }
        else {
            // If it's a string, treat each line or sentence as a separate outcome
            const outcomesValue = pd.outcomes;
            const outcomesList = typeof outcomesValue === 'string'
                ? outcomesValue.split(/[.;]\s*/).filter((s) => s.trim().length > 0)
                : [String(outcomesValue)];
            parts.push(...outcomesList.map((o) => `- ${o.trim()}`));
        }
    }
    return parts.join("\n");
}
function renderPrimaryPersonas(prd) {
    const personas = prd.targetAudience;
    if (!personas?.length)
        return "TBD";
    // Use first 1-3 personas as primary
    const primary = personas.slice(0, Math.min(3, personas.length));
    return primary.map((p, idx) => renderPersona(p, idx + 1)).join("\n\n");
}
function renderSecondaryPersonas(prd) {
    const personas = prd.targetAudience;
    if (!personas || personas.length <= 3)
        return "None identified.";
    const secondary = personas.slice(3);
    return secondary.map((p, idx) => renderPersona(p, idx + 1, true)).join("\n\n");
}
function renderPersona(p, num, isSecondary = false) {
    const prefix = isSecondary ? `**Secondary Persona ${num}**` : `**Primary Persona ${num}**`;
    const parts = [prefix];
    if (p.name)
        parts.push(`**Name:** ${p.name}`);
    if (p.role)
        parts.push(`**Role:** ${p.role}`);
    if (p.segment)
        parts.push(`**Segment:** ${p.segment}`);
    if (p.demographics) {
        const demo = typeof p.demographics === "string" ? p.demographics : JSON.stringify(p.demographics);
        parts.push(`**Demographics:** ${demo}`);
    }
    const goals = ensureArray(p.goals);
    if (goals.length) {
        parts.push(`**Goals:**`);
        parts.push(...goals.map((g) => `- ${g}`));
    }
    const painPoints = ensureArray(p.painPoints);
    if (painPoints.length) {
        parts.push(`**Pain Points:**`);
        parts.push(...painPoints.map((pp) => `- ${pp}`));
    }
    const jobsToBeDone = ensureArray(p.jobsToBeDone);
    if (jobsToBeDone.length) {
        parts.push(`**Jobs to be Done:**`);
        parts.push(...jobsToBeDone.map((jtbd) => `- ${jtbd}`));
    }
    return parts.join("\n");
}
function renderInternalStakeholders(prd) {
    const stakeholders = prd.stakeholdersAndRaci?.stakeholders;
    if (!stakeholders?.length) {
        // Try to infer from documentMetadata
        const doc = prd.documentMetadata;
        if (doc?.collaborators?.length) {
            return doc.collaborators.map(c => `- **${c}:** Involved in product development and delivery`).join("\n");
        }
        return "TBD";
    }
    return stakeholders.map(sh => {
        const parts = [`- **${sh.name}** (${sh.role})`];
        if (sh.influence)
            parts.push(`  - Influence: ${sh.influence}`);
        if (sh.interest)
            parts.push(`  - Interest: ${sh.interest}`);
        if (sh.engagementLevel)
            parts.push(`  - Engagement: ${sh.engagementLevel}`);
        return parts.join("\n");
    }).join("\n\n");
}
function renderValueProposition(prd) {
    const so = prd.solutionOverview;
    if (!so)
        return "TBD";
    const parts = [];
    if (so.valueProposition) {
        parts.push(so.valueProposition);
    }
    const differentiators = ensureArray(so.differentiators);
    if (differentiators.length) {
        parts.push(`\n**Key Differentiators:**`);
        parts.push(...differentiators.map(d => `- ${d}`));
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderStrategicModel(prd) {
    const lc = prd.leanCanvas;
    if (!lc)
        return "TBD";
    const parts = [];
    const customerSegments = ensureArray(lc.customerSegments);
    if (customerSegments.length) {
        parts.push(`**Customer Segments:** ${customerSegments.join(", ")}`);
    }
    const channels = ensureArray(lc.channels);
    if (channels.length) {
        parts.push(`**Channels:** ${channels.join(", ")}`);
    }
    const keyMetrics = ensureArray(lc.keyMetrics);
    if (keyMetrics.length) {
        parts.push(`**Key Metrics:**`);
        parts.push(...keyMetrics.map(m => `- ${m}`));
    }
    const revenueStreams = ensureArray(lc.revenueStreams);
    if (revenueStreams.length) {
        parts.push(`**Revenue Streams:** ${revenueStreams.join(", ")}`);
    }
    const costStructure = ensureArray(lc.costStructure);
    if (costStructure.length) {
        parts.push(`**Cost Structure:** ${costStructure.join(", ")}`);
    }
    return parts.length ? parts.join("\n\n") : "TBD";
}
function renderProductGoals(prd) {
    const goals = prd.goalsAndSuccessCriteria?.primaryGoals;
    if (!goals?.length)
        return "TBD";
    return goals.map(g => `- ${g}`).join("\n");
}
function renderSuccessMetrics(prd) {
    const metrics = prd.goalsAndSuccessCriteria?.successMetrics;
    if (!metrics?.length)
        return "TBD";
    const lines = [];
    lines.push("| Metric | Description | Target | Measurement Method |");
    lines.push("|--------|-------------|--------|-------------------|");
    metrics.forEach((m) => {
        lines.push(`| ${escapeTableCell(m.name)} | ${escapeTableCell(m.description)} | ${escapeTableCell(m.target || "TBD")} | ${escapeTableCell(m.measurementMethod || "TBD")} |`);
    });
    return lines.join("\n");
}
function renderMvpInScope(prd) {
    const scope = prd.mvpScope;
    if (!scope)
        return "TBD";
    const parts = [];
    const inScope = ensureArray(scope.inScope);
    if (inScope.length) {
        parts.push(...inScope.map(item => `- ${item}`));
    }
    if (scope.features?.length) {
        parts.push(...scope.features.map(f => `- **${f.name}**${f.description ? `: ${f.description}` : ""}`));
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderMvpOutOfScope(prd) {
    const out = ensureArray(prd.mvpScope?.outOfScope);
    if (!out.length)
        return "None explicitly excluded.";
    return out.map(item => `- ${item}`).join("\n");
}
function renderFunctionalRequirements(prd) {
    const reqs = prd.productRequirements;
    if (!reqs?.length)
        return "TBD";
    const parts = [];
    reqs.forEach((req) => {
        parts.push(`### ${req.module}`);
        if (req.purpose) {
            parts.push(`**Description**\n${req.purpose}`);
        }
        else {
            parts.push(`**Description**\n${req.objective}`);
        }
        if (req.features?.length) {
            parts.push(`**Acceptance Criteria**`);
            req.features.forEach(f => {
                if (f.acceptanceCriteria?.length) {
                    f.acceptanceCriteria.forEach(ac => {
                        parts.push(`- ${ac.description}`);
                    });
                }
            });
        }
        if (req.constraints?.length) {
            parts.push(`**Edge Cases / Exceptions**`);
            req.constraints.forEach((c) => {
                parts.push(`- ${c}`);
            });
        }
        parts.push(""); // Empty line between modules
    });
    return parts.join("\n");
}
function renderKeyUserFlows(prd) {
    const flows = prd.criticalUserFlows;
    if (!flows?.length)
        return "TBD";
    const parts = [];
    flows.forEach((flow) => {
        parts.push(`**${flow.name}** (Role: ${flow.role})`);
        parts.push(`*Goal:* ${flow.goal}`);
        if (flow.steps?.length) {
            parts.push(`*Steps:*`);
            flow.steps.slice(0, 15).forEach((s) => {
                const screen = s.screen ? ` → ${s.screen}` : "";
                parts.push(`  ${s.stepNumber}. ${s.action}${screen}`);
            });
        }
        parts.push(""); // Empty line between flows
    });
    return parts.join("\n");
}
function renderNavigationArchitecture(prd) {
    const parts = [];
    // List screens
    if (prd.screens?.length) {
        parts.push(`**Screens/Views:**`);
        parts.push(...prd.screens.slice(0, 20).map(s => `- ${s.name}${s.path ? ` (${s.path})` : ""}`));
        parts.push("");
    }
    // Navigation structure
    if (prd.navigation?.length) {
        parts.push(`**Navigation Structure:**`);
        prd.navigation.slice(0, 15).forEach((nav) => {
            if (nav.path) {
                parts.push(`- ${nav.label || nav.path}: ${nav.path}`);
            }
        });
        parts.push("");
    }
    // Role-based access
    if (prd.roleDefinition?.accessMatrix?.length) {
        parts.push(`**Role-Based Access:**`);
        const roleCols = new Set();
        prd.roleDefinition.accessMatrix.forEach((row) => {
            Object.keys(row).forEach(k => { if (k !== "feature")
                roleCols.add(k); });
        });
        const roles = Array.from(roleCols);
        if (roles.length > 0) {
            parts.push(`Roles: ${roles.join(", ")}`);
        }
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderDataDomainModel(prd) {
    const dm = prd.dataModel;
    if (!dm)
        return "TBD";
    const entities = dm.entities ? dm.entities : dm;
    const parts = [];
    Object.entries(entities || {}).forEach(([entityName, entity]) => {
        parts.push(`**${entityName}**`);
        if (entity.fields) {
            const fieldNames = Object.keys(entity.fields).slice(0, 10);
            parts.push(`Fields: ${fieldNames.join(", ")}${Object.keys(entity.fields).length > 10 ? "..." : ""}`);
        }
        if (entity.relationships?.length) {
            parts.push(`Relationships: ${entity.relationships.map((r) => `${r.type} → ${r.target}`).join(", ")}`);
        }
        parts.push("");
    });
    return parts.length ? parts.join("\n") : "TBD";
}
function renderTechnicalConstraints(prd) {
    const reqs = prd.technicalRequirements;
    if (!reqs?.length)
        return "TBD";
    const parts = [];
    const byCat = {};
    reqs.forEach((r) => {
        if (!byCat[r.category])
            byCat[r.category] = [];
        byCat[r.category].push(r);
    });
    Object.entries(byCat).forEach(([cat, items]) => {
        parts.push(`**${cat.charAt(0).toUpperCase() + cat.slice(1)}:**`);
        items.forEach((i) => {
            i.requirements?.forEach((x) => parts.push(`- ${x}`));
        });
        parts.push("");
    });
    return parts.join("\n").trim() || "TBD";
}
function renderNonFunctionalRequirementsGold(prd) {
    const reqs = prd.nonFunctionalRequirements;
    if (!reqs?.length)
        return "TBD";
    const parts = [];
    const byCat = {};
    reqs.forEach((r) => {
        if (!byCat[r.category])
            byCat[r.category] = [];
        byCat[r.category].push(r);
    });
    Object.entries(byCat).forEach(([cat, items]) => {
        parts.push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
        items.forEach((i) => {
            if (i.requirements?.length) {
                i.requirements.forEach((req) => {
                    parts.push(`- **Requirement:** ${req}`);
                });
            }
            if (i.metrics && Object.keys(i.metrics).length) {
                Object.entries(i.metrics).forEach(([k, v]) => {
                    parts.push(`- **Metric:** ${k} = ${v}`);
                });
            }
        });
        parts.push("");
    });
    return parts.join("\n").trim() || "TBD";
}
function renderDependenciesGold(prd) {
    const d = prd.dependencies;
    if (!d)
        return "TBD";
    const parts = [];
    if (d.service?.length) {
        parts.push(`- **Technical:**`);
        d.service.forEach((dep) => {
            parts.push(`  - ${dep.name}: ${dep.description}`);
        });
    }
    if (d.operational?.length) {
        parts.push(`- **Operational:**`);
        d.operational.forEach((dep) => {
            parts.push(`  - ${dep.description}`);
        });
    }
    if (d.content?.length) {
        parts.push(`- **Legal:**`);
        d.content.forEach((dep) => {
            parts.push(`  - ${dep.description}`);
        });
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderAssumptionsGold(prd) {
    const a = prd.assumptions;
    if (!a)
        return "TBD";
    const parts = [];
    const technical = ensureArray(a.technical);
    if (technical.length) {
        parts.push(...technical.map(x => `- ${x}`));
    }
    const operational = ensureArray(a.operational);
    if (operational.length) {
        parts.push(...operational.map(x => `- ${x}`));
    }
    const financial = ensureArray(a.financial);
    if (financial.length) {
        parts.push(...financial.map(x => `- ${x}`));
    }
    const legal = ensureArray(a.legal);
    if (legal.length) {
        parts.push(...legal.map(x => `- ${x}`));
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderRiskManagementGold(prd) {
    const risks = prd.riskManagement?.risks;
    if (!risks?.length)
        return "TBD";
    const lines = [];
    lines.push("| Risk Description | Likelihood | Impact | Mitigation Strategy |");
    lines.push("|------------------|------------|--------|---------------------|");
    risks.forEach((r) => {
        lines.push(`| ${escapeTableCell(r.description)} | ${escapeTableCell(r.probability)} | ${escapeTableCell(r.impact)} | ${escapeTableCell(r.mitigationStrategy || "TBD")} |`);
    });
    return lines.join("\n");
}
function renderDeliveryPlan(prd) {
    if (!prd.deliveryTimeline)
        return "TBD";
    return generateDeliveryTimelineSection(prd.deliveryTimeline)
        .replace(/^##\s+\d+\.?\s+Delivery Timeline.*\n\n?/m, "")
        .trim() || "TBD";
}
function renderLaunchPlanGold(prd) {
    if (!prd.launchPlan)
        return "TBD";
    return generateLaunchPlanSection(prd.launchPlan)
        .replace(/^##\s+\d+\.?\s+Launch Plan\n\n?/m, "")
        .trim() || "TBD";
}
function renderOpenQuestionsGold(prd, questions) {
    const oq = prd.openQuestions;
    const parts = [];
    // Add questions from openQuestions
    if (oq?.questions?.length) {
        const lines = [];
        lines.push("| Question / Decision | Context / Impact | Owner | Status | Deadline |");
        lines.push("|--------------------|------------------|-------|--------|----------|");
        oq.questions.forEach((q) => {
            lines.push(`| ${escapeTableCell(q.question)} | ${escapeTableCell(q.context || "TBD")} | TBD | TBD | TBD |`);
        });
        parts.push(lines.join("\n"));
    }
    // Add questions from questionsForClient if available
    if (questions.questions?.length) {
        if (parts.length)
            parts.push("");
        parts.push("**Additional Questions for Client:**");
        questions.questions.forEach((q) => {
            parts.push(`- [${q.priority}] ${q.question}${q.reason ? ` — ${q.reason}` : ""}`);
        });
    }
    return parts.length ? parts.join("\n\n") : "None identified.";
}
function renderAppendixGold(prd) {
    const parts = [];
    if (prd.aiMetadata) {
        parts.push(`**Extraction metadata**`);
        parts.push(`- Extracted At: ${new Date(prd.aiMetadata.extractedAt || Date.now()).toLocaleString()}`);
        if (prd.aiMetadata.extractionNotes) {
            const notes = Array.isArray(prd.aiMetadata.extractionNotes)
                ? prd.aiMetadata.extractionNotes
                : [prd.aiMetadata.extractionNotes];
            parts.push(`- Extraction Notes: ${notes.join("; ")}`);
        }
        if (prd.aiMetadata.stackDetected?.length) {
            parts.push(`- Stack Detected: ${prd.aiMetadata.stackDetected.join(", ")}`);
        }
        if (prd.aiMetadata.dataQualityAssessment) {
            parts.push(`**Confidence levels**`);
            const dqa = prd.aiMetadata.dataQualityAssessment;
            if (dqa.highConfidence?.length) {
                parts.push(`- High Confidence: ${dqa.highConfidence.join(", ")}`);
            }
            if (dqa.mediumConfidence?.length) {
                parts.push(`- Medium Confidence: ${dqa.mediumConfidence.join(", ")}`);
            }
            if (dqa.lowConfidence?.length) {
                parts.push(`- Low Confidence: ${dqa.lowConfidence.join(", ")}`);
            }
        }
        if (prd.aiMetadata.missingInformation) {
            parts.push(`**Known gaps**`);
            const mi = prd.aiMetadata.missingInformation;
            if (mi.fromTier3?.length) {
                parts.push(`- Missing from Tier 3: ${mi.fromTier3.join(", ")}`);
            }
            if (mi.potentialSources?.length) {
                parts.push(`- Potential Sources: ${mi.potentialSources.join(", ")}`);
            }
        }
    }
    // Source mapping
    if (prd.screens?.length || prd.api?.length) {
        parts.push(`**Source mapping**`);
        if (prd.screens?.length) {
            parts.push(`- Screens detected: ${prd.screens.length}`);
        }
        if (prd.api?.length) {
            parts.push(`- API endpoints detected: ${prd.api.length}`);
        }
    }
    return parts.length ? parts.join("\n") : "TBD";
}
// ============================================================================
// LEGACY TEMPLATE RENDER FUNCTIONS (for backwards compatibility)
// ============================================================================
function renderArcaStyleToc() {
    // Keep this list stable to match the PRD template structure.
    const items = [
        "Summary",
        "Problem Statement & Outcomes",
        "Goals & Success Criteria",
        "MVP Scope",
        "Target Audience / Personas",
        "Assumptions",
        "Dependencies",
        "Role Definition / Access Model",
        "Product Requirements / Acceptance Criteria",
        "Dependency mapping",
        "User Interaction and Design",
        "Technical Requirements",
        "Non-Functional Requirements",
        "Risk Management",
        "Delivery timeline & cost",
        "Launch Plan",
        "Stakeholders, Roles & RACI",
        "Open Questions & Decisions",
        "Change log",
        "Appendix",
    ];
    const toAnchor = (s) => s
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s/-]/g, "")
        .replace(/\s+/g, "-");
    return [
        "### Table of Content",
        "",
        ...items.map((i) => `- [${i}](#${toAnchor(i)})`),
        "",
    ].join("\n");
}
function renderSummary(prd) {
    const pieces = [];
    const overview = prd.executiveSummary?.overview || prd.solutionOverview?.valueProposition;
    if (overview)
        pieces.push(overview);
    const highlights = prd.executiveSummary?.solutionHighlights;
    if (highlights)
        pieces.push(highlights);
    return pieces.length ? pieces.join("\n\n") : "TBD";
}
function renderProblemStatementAndOutcomes(prd) {
    const parts = [];
    const primary = prd.problemDefinition?.primaryProblem;
    if (primary)
        parts.push(`**Problem:** ${primary}`);
    const marketGap = prd.problemDefinition?.marketGap;
    if (marketGap)
        parts.push(`\n**Market Gap:** ${marketGap}`);
    const context = prd.problemDefinition?.context;
    if (context)
        parts.push(`\n**Context:** ${context}`);
    const impact = prd.problemDefinition?.businessImpact;
    if (impact)
        parts.push(`\n**Business impact:** ${impact}`);
    const pains = prd.problemDefinition?.userPainPoints;
    if (pains?.length) {
        parts.push("\n**User pain points:**");
        parts.push(...pains.map((p) => `- ${p}`));
    }
    const outcomes = prd.problemDefinition?.outcomes;
    if (outcomes) {
        parts.push("\n**Outcomes:**");
        // Handle both array and string cases (AI sometimes returns string instead of array)
        if (Array.isArray(outcomes)) {
            parts.push(...outcomes.map((o) => `- ${o}`));
        }
        else {
            // If it's a string, treat each line or sentence as a separate outcome
            const outcomesList = typeof outcomes === 'string'
                ? outcomes.split(/[.;]\s*/).filter(s => s.trim().length > 0)
                : [String(outcomes)];
            parts.push(...outcomesList.map((o) => `- ${o.trim()}`));
        }
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderGoalsAndSuccessCriteria(prd) {
    const parts = [];
    const goals = prd.goalsAndSuccessCriteria?.primaryGoals;
    if (goals?.length) {
        parts.push("**Primary Goals:**");
        parts.push(...goals.map((g) => `- ${g}`));
        parts.push("");
    }
    const metrics = prd.goalsAndSuccessCriteria?.successMetrics;
    if (metrics?.length) {
        parts.push("| **Metric** | **Description** | **Target** | **Measurement** |");
        parts.push("| --- | --- | --- | --- |");
        metrics.forEach((m) => {
            parts.push(`| ${escapeTableCell(m.name)} | ${escapeTableCell(m.description)} | ${escapeTableCell(m.target || "TBD")} | ${escapeTableCell(m.measurementMethod || "TBD")} |`);
        });
        parts.push("");
    }
    const kpis = prd.goalsAndSuccessCriteria?.kpis;
    if (kpis?.length) {
        parts.push("**KPIs:**");
        parts.push(...kpis.map((k) => `- ${k}`));
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderMvpScope(prd) {
    const parts = [];
    const inScope = prd.mvpScope?.inScope;
    if (inScope?.length) {
        parts.push("In scope:");
        parts.push("");
        parts.push(...inScope.map((x) => `- ${x}`));
        parts.push("");
    }
    const features = prd.mvpScope?.features;
    if (features?.length) {
        if (!inScope?.length)
            parts.push("In scope:");
        parts.push("");
        parts.push(...features.map((f) => `- ${f.name}${f.description ? ` — ${f.description}` : ""}`));
        parts.push("");
    }
    const out = prd.mvpScope?.outOfScope;
    if (out?.length) {
        parts.push("Out of Scope:");
        parts.push("");
        parts.push(...out.map((o) => `- ${o}`));
    }
    const roleStages = prd.mvpScope?.roleStages;
    if (roleStages?.length) {
        parts.push("");
        parts.push("Role/Stage breakdown:");
        parts.push("");
        roleStages.forEach((rs) => {
            parts.push(`- **${rs.role}**`);
            rs.stages?.forEach((stage) => {
                parts.push(`  - ${stage.name}`);
                stage.items?.forEach((it) => parts.push(`    - ${it}`));
            });
        });
    }
    return parts.length ? parts.join("\n") : "TBD";
}
function renderTargetAudience(prd) {
    const personas = prd.targetAudience;
    if (!personas?.length)
        return "TBD";
    const parts = [];
    personas.forEach((p, idx) => {
        parts.push(`Persona ${idx + 1} — ${p.name}`);
        const bullets = [];
        if (p.role)
            bullets.push(`Role: ${p.role}`);
        if (p.segment)
            bullets.push(`Segment: ${p.segment}`);
        if (p.geography)
            bullets.push(`Geography: ${p.geography}`);
        if (p.techComfort)
            bullets.push(`Tech comfort: ${p.techComfort}`);
        if (p.demographics)
            bullets.push(`Demographics: ${typeof p.demographics === "string" ? p.demographics : JSON.stringify(p.demographics)}`);
        if (p.goals?.length)
            bullets.push(`Goals: ${p.goals.join("; ")}`);
        if (p.painPoints?.length)
            bullets.push(`Pain points: ${p.painPoints.join("; ")}`);
        if (p.jobsToBeDone?.length)
            bullets.push(`Jobs to be done: ${p.jobsToBeDone.join("; ")}`);
        if (bullets.length) {
            parts.push("");
            parts.push(...bullets.map((b) => `- ${b}`));
        }
        parts.push("");
    });
    return parts.join("\n").trim() || "TBD";
}
function renderAssumptions(prd) {
    const a = prd.assumptions;
    if (!a)
        return "TBD";
    const parts = [];
    if (a.technical?.length) {
        parts.push("### Technical Assumptions");
        parts.push(...a.technical.map((x) => `- ${x}`), "");
    }
    if (a.operational?.length) {
        parts.push("### Operational Assumptions");
        parts.push(...a.operational.map((x) => `- ${x}`), "");
    }
    if (a.financial?.length) {
        parts.push("### Financial Assumptions");
        parts.push(...a.financial.map((x) => `- ${x}`), "");
    }
    if (a.legal?.length) {
        parts.push("### Legal/Compliance Assumptions");
        parts.push(...a.legal.map((x) => `- ${x}`), "");
    }
    return parts.length ? parts.join("\n").trim() : "TBD";
}
function renderDependencies(prd) {
    const d = prd.dependencies;
    if (!d)
        return "TBD";
    const parts = [];
    if (d.service?.length) {
        parts.push("**Service Dependencies:**");
        d.service.forEach((dep) => {
            parts.push(`- ${dep.name}: ${dep.description}${dep.impact ? ` (Impact: ${dep.impact})` : ""}`);
        });
        parts.push("");
    }
    if (d.operational?.length) {
        parts.push("**Operational Dependencies:**");
        d.operational.forEach((dep) => {
            parts.push(`- ${dep.description}${dep.requirement ? ` (Requirement: ${dep.requirement})` : ""}`);
        });
        parts.push("");
    }
    if (d.content?.length) {
        parts.push("**Content & Legal Dependencies:**");
        d.content.forEach((dep) => {
            parts.push(`- ${dep.description}${dep.source ? ` (Source: ${dep.source})` : ""}`);
        });
    }
    return parts.length ? parts.join("\n").trim() : "TBD";
}
function renderRoleDefinition(prd) {
    const r = prd.roleDefinition;
    if (!r)
        return "TBD";
    const parts = [];
    if (r.roles?.length) {
        parts.push("**Definitions**");
        parts.push("");
        r.roles.forEach((role) => {
            parts.push(`- ${role.name}: ${role.description} (id: ${role.id})`);
        });
        parts.push("");
    }
    if (r.accessMatrix?.length) {
        parts.push("**Access Model**");
        parts.push("");
        const roleColumns = new Set();
        r.accessMatrix.forEach((row) => {
            Object.keys(row).forEach((k) => {
                if (k !== "feature")
                    roleColumns.add(k);
            });
        });
        const headers = Array.from(roleColumns);
        parts.push(`| Feature | ${headers.join(" | ")} |`);
        parts.push(`| --- | ${headers.map(() => "---").join(" | ")} |`);
        r.accessMatrix.forEach((row) => {
            const cells = headers.map((h) => escapeTableCell(row[h] || "-"));
            parts.push(`| ${escapeTableCell(row.feature || "-")} | ${cells.join(" | ")} |`);
        });
    }
    return parts.length ? parts.join("\n").trim() : "TBD";
}
function renderProductRequirementsTable(prd) {
    const reqs = prd.productRequirements;
    if (!reqs?.length)
        return "TBD";
    const lines = [];
    lines.push("| **Feature Area** | **Summary** |");
    lines.push("| --- | --- |");
    reqs.forEach((req) => {
        const featureLines = [];
        if (req.features?.length) {
            req.features.slice(0, 8).forEach((f) => {
                featureLines.push(`• ${f.name}${f.description ? `: ${f.description}` : ""}`);
            });
            if (req.features.length > 8)
                featureLines.push(`• ...and ${req.features.length - 8} more`);
        }
        const purpose = req.purpose;
        const keyCaps = req.keyCapabilities;
        const systemResponsibilities = req.systemResponsibilities;
        const constraints = req.constraints;
        const summary = [
            purpose ? `**Purpose:** ${purpose}` : "",
            `**Objective:** ${req.objective}`,
            keyCaps?.length
                ? `**Key Capabilities:**<br>${keyCaps.map((c) => `• ${c}`).join("<br>")}`
                : featureLines.length
                    ? `**Key Capabilities:**<br>${featureLines.join("<br>")}`
                    : "",
            systemResponsibilities?.length
                ? `**System Responsibilities:**<br>${systemResponsibilities.map((c) => `• ${c}`).join("<br>")}`
                : "",
            constraints?.length ? `**Constraints:**<br>${constraints.map((c) => `• ${c}`).join("<br>")}` : "",
        ]
            .filter(Boolean)
            .join("<br><br>");
        lines.push(`| **${escapeTableCell(req.module)}** | ${escapeTableCell(summary)} |`);
    });
    lines.push("");
    lines.push("_Note: detailed acceptance criteria are captured in the structured JSON and can be expanded per module/feature._");
    return lines.join("\n");
}
function renderDependencyMapping(prd) {
    const mapping = prd.dependencyMapping;
    if (!mapping?.length)
        return "TBD";
    const lines = [];
    lines.push("| Feature Area | Depends On | Description |");
    lines.push("| --- | --- | --- |");
    mapping.forEach((m) => {
        lines.push(`| ${escapeTableCell(m.featureArea)} | ${escapeTableCell((m.dependsOn || []).join(", ") || "TBD")} | ${escapeTableCell(m.description || "TBD")} |`);
    });
    return lines.join("\n");
}
function renderUserInteractionAndDesign(prd) {
    const flows = prd.criticalUserFlows;
    if (!flows?.length)
        return "TBD";
    const parts = [];
    flows.forEach((flow) => {
        parts.push(`- **${flow.name}** (Role: ${flow.role}) — ${flow.goal}`);
        if (flow.steps?.length) {
            flow.steps.slice(0, 15).forEach((s) => {
                const screen = s.screen ? ` → ${s.screen}` : "";
                parts.push(`  - ${s.stepNumber}. ${s.action}${screen}`);
            });
        }
    });
    return parts.join("\n");
}
function renderTechnicalRequirements(prd) {
    const reqs = prd.technicalRequirements;
    if (!reqs?.length)
        return "TBD";
    const parts = [];
    const byCat = {};
    reqs.forEach((r) => {
        if (!byCat[r.category])
            byCat[r.category] = [];
        byCat[r.category].push(r);
    });
    Object.entries(byCat).forEach(([cat, items]) => {
        parts.push(`- **${cat}**`);
        items.forEach((i) => {
            i.requirements?.forEach((x) => parts.push(`  - ${x}`));
        });
    });
    return parts.join("\n");
}
function renderNonFunctionalRequirements(prd) {
    const reqs = prd.nonFunctionalRequirements;
    if (!reqs?.length)
        return "TBD";
    const parts = [];
    const byCat = {};
    reqs.forEach((r) => {
        if (!byCat[r.category])
            byCat[r.category] = [];
        byCat[r.category].push(r);
    });
    Object.entries(byCat).forEach(([cat, items]) => {
        parts.push(`- **${cat}**`);
        items.forEach((i) => {
            i.requirements?.forEach((x) => parts.push(`  - ${x}`));
            if (i.metrics && Object.keys(i.metrics).length) {
                Object.entries(i.metrics).forEach(([k, v]) => parts.push(`  - Metric: ${k} = ${v}`));
            }
        });
    });
    return parts.join("\n");
}
function renderRiskManagement(prd) {
    const risks = prd.riskManagement?.risks;
    if (!risks?.length)
        return "TBD";
    const lines = [];
    lines.push("| **Risk** | **Probability** | **Impact** | **Mitigation** |");
    lines.push("| --- | --- | --- | --- |");
    risks.forEach((r) => {
        lines.push(`| ${escapeTableCell(r.description)} | ${escapeTableCell(r.probability)} | ${escapeTableCell(r.impact)} | ${escapeTableCell(r.mitigationStrategy || "TBD")} |`);
    });
    return lines.join("\n");
}
function renderDeliveryTimelineAndCost(prd) {
    if (!prd.deliveryTimeline)
        return "TBD";
    // Reuse existing helper, but strip its top-level headings to fit the Arca-style section.
    const raw = generateDeliveryTimelineSection(prd.deliveryTimeline);
    return raw.replace(/^##\s+\d+\.?\s+Delivery Timeline.*\n\n?/m, "").trim() || "TBD";
}
function renderLaunchPlan(prd) {
    if (!prd.launchPlan)
        return "TBD";
    const raw = generateLaunchPlanSection(prd.launchPlan);
    return raw.replace(/^##\s+\d+\.?\s+Launch Plan\n\n?/m, "").trim() || "TBD";
}
function renderStakeholdersRaci(prd) {
    if (!prd.stakeholdersAndRaci)
        return "TBD";
    const raw = generateStakeholdersRaciSection(prd.stakeholdersAndRaci);
    return raw.replace(/^##\s+\d+\.?\s+Stakeholders.*\n\n?/m, "").trim() || "TBD";
}
function renderOpenQuestionsAndDecisions(prd) {
    const oq = prd.openQuestions;
    if (!oq)
        return "TBD";
    const parts = [];
    if (oq.questions?.length) {
        parts.push("**Open Questions**");
        oq.questions.forEach((q) => {
            parts.push(`- [${q.priority || "medium"}] ${q.question}${q.context ? ` — ${q.context}` : ""}`);
        });
        parts.push("");
    }
    if (oq.decisions?.length) {
        parts.push("**Decisions**");
        oq.decisions.forEach((d) => {
            parts.push(`- ${d.decision}${d.rationale ? ` — ${d.rationale}` : ""}${d.date ? ` (${d.date})` : ""}`);
        });
    }
    return parts.length ? parts.join("\n").trim() : "TBD";
}
function renderChangeLog(prd) {
    const version = prd.project?.version || "1.0.0";
    const date = new Date(prd.project?.createdAt || Date.now()).toLocaleDateString();
    return [
        "| Version | Date | Changes | Author |",
        "| --- | --- | --- | --- |",
        `| ${escapeTableCell(version)} | ${escapeTableCell(date)} | Initial PRD | Product Team |`,
    ].join("\n");
}
function renderAppendix(prd) {
    if (!prd.aiMetadata)
        return "TBD";
    const parts = [];
    parts.push(`**Extracted At:** ${new Date(prd.aiMetadata.extractedAt || Date.now()).toLocaleString()}`);
    if (prd.aiMetadata.extractionNotes) {
        const notes = Array.isArray(prd.aiMetadata.extractionNotes) ? prd.aiMetadata.extractionNotes : [prd.aiMetadata.extractionNotes];
        parts.push(`\n**Extraction Notes:** ${notes.join("; ")}`);
    }
    return parts.join("\n");
}
function escapeTableCell(value) {
    return String(value)
        .replace(/\|/g, "\\|")
        .replace(/\r?\n/g, "<br>");
}
//# sourceMappingURL=prdGenerator.js.map