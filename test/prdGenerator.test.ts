import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { writePrdArtifacts } from "../src/core/prdGenerator";
import type { PrdJson, QuestionsForClient } from "../src/models/schema";

describe("prdGenerator (Gold Standard template)", () => {
  it("renders the PRD markdown using the gold standard template by default", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(process.cwd(), "tmp-test-prd-"));
    try {
      const prd: PrdJson = {
        project: {
          id: "proj-1",
          name: "Example Project",
          version: "1.0.0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        documentMetadata: {
          documentOwner: "@owner",
          stakeholders: ["@stakeholder"],
          collaborators: ["@collab"],
          referenceDocuments: ["(redacted)"],
          jiraLink: "TBD",
          trdLink: "(redacted)",
          status: "Draft",
        },
        problemDefinition: {
          primaryProblem: "Users cannot easily do X.",
          marketGap: "Existing tools do not provide Y.",
          outcomes: ["Reduce time to complete X", "Increase adoption"],
        },
        goalsAndSuccessCriteria: {
          primaryGoals: ["Launch MVP", "Validate PMF"],
          successMetrics: [
            {
              name: "Activation",
              description: "Users complete onboarding",
              target: ">= 50%",
              measurementMethod: "Event tracking",
            },
          ],
        },
        mvpScope: {
          phase: "1",
          inScope: ["Signup", "Core workflow"],
          outOfScope: ["Advanced analytics"],
        },
        productRequirements: [
          {
            module: "Onboarding",
            purpose: "Get users set up quickly",
            objective: "Enable first successful login",
            keyCapabilities: ["Walkthrough", "Skip flow"],
            systemResponsibilities: ["Track completion"],
            constraints: ["No personalization in MVP"],
            features: [
              {
                name: "Walkthrough",
                description: "Step-by-step onboarding",
                acceptanceCriteria: [
                  { id: "ac-1", description: "Walkthrough can be skipped", testable: true },
                ],
              },
            ],
          },
        ],
        dependencyMapping: [
          {
            featureArea: "Onboarding",
            dependsOn: ["Auth service"],
            description: "Users must authenticate before onboarding completes",
          },
        ],
      };

      const questions: QuestionsForClient = { questions: [], generatedAt: new Date().toISOString() };

      const { markdownFilename } = await writePrdArtifacts(prd, questions, {
        outputDir: tmpRoot,
        projectName: prd.project.name,
      });

      const markdown = await fs.readFile(path.join(tmpRoot, markdownFilename), "utf-8");

      // Gold template structure checks
      expect(markdown).toContain("# Gold Standard Product Requirements Document (PRD)");
      expect(markdown).toContain("## 0. Document Metadata");
      expect(markdown).toContain("## 1. Executive Summary");
      expect(markdown).toContain("## 2. Brand & Product Foundations");
      expect(markdown).toContain("### 3.1 Primary Problem");
      expect(markdown).toContain("## 4. User & Stakeholder Landscape");
      expect(markdown).toContain("## 5. Value Proposition & Solution Overview");
      expect(markdown).toContain("## 6. Strategic Model");
      expect(markdown).toContain("## 7. Goals, Success Metrics & KPIs");
      expect(markdown).toContain("## 8. Scope Definition");
      expect(markdown).toContain("## 9. Functional Requirements & Acceptance Criteria");
      expect(markdown).toContain("## 10. User Experience & Interaction Design");
      expect(markdown).toContain("## 11. Data & Domain Model");
      expect(markdown).toContain("## 12. Technical Constraints & Architecture (High-Level)");
      expect(markdown).toContain("## 13. Non-Functional Requirements");
      expect(markdown).toContain("## 14. Dependencies & Assumptions");
      expect(markdown).toContain("## 15. Risk Management");
      expect(markdown).toContain("## 16. Delivery Plan & Cost");
      expect(markdown).toContain("## 17. Launch & Rollout Plan");
      expect(markdown).toContain("### 18. Open Questions & Decisions Log");
      expect(markdown).toContain("## 19. Change Log");
      expect(markdown).toContain("## 20. Appendix (AI-Friendly)");
      
      // Ensure no placeholders remain
      expect(markdown).not.toContain("{{");
      
      // Ensure HTML comments are stripped by default
      expect(markdown).not.toContain("<!--");
      expect(markdown).not.toContain("-->");
      
      // Verify section ordering
      const idxMetadata = markdown.indexOf("## 0. Document Metadata");
      const idxExecutive = markdown.indexOf("## 1. Executive Summary");
      const idxBrand = markdown.indexOf("## 2. Brand & Product Foundations");
      const idxProblem = markdown.indexOf("### 3.1 Primary Problem");
      expect(idxMetadata).toBeGreaterThan(-1);
      expect(idxExecutive).toBeGreaterThan(idxMetadata);
      expect(idxBrand).toBeGreaterThan(idxExecutive);
      expect(idxProblem).toBeGreaterThan(idxBrand);
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  });

  it("includes HTML comments when includeTemplateInstructions is true", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(process.cwd(), "tmp-test-prd-"));
    try {
      const prd: PrdJson = {
        project: {
          id: "proj-1",
          name: "Example Project",
          version: "1.0.0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        documentMetadata: {
          documentOwner: "@owner",
          stakeholders: ["@stakeholder"],
          status: "Draft",
        },
        executiveSummary: {
          overview: "Test executive summary",
        },
      };

      const questions: QuestionsForClient = { questions: [], generatedAt: new Date().toISOString() };

      const { markdownFilename } = await writePrdArtifacts(prd, questions, {
        outputDir: tmpRoot,
        projectName: prd.project.name,
        includeTemplateInstructions: true,
      });

      const markdown = await fs.readFile(path.join(tmpRoot, markdownFilename), "utf-8");

      // Should contain HTML comments when flag is enabled
      expect(markdown).toContain("<!--");
      expect(markdown).toContain("-->");
      expect(markdown).toContain("INSTRUCTION:");
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  });

  it("falls back to legacy template if gold template not found and custom path provided", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(process.cwd(), "tmp-test-prd-"));
    try {
      const prd: PrdJson = {
        project: {
          id: "proj-1",
          name: "Example Project",
          version: "1.0.0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        documentMetadata: {
          documentOwner: "@owner",
        },
      };

      const questions: QuestionsForClient = { questions: [], generatedAt: new Date().toISOString() };

      // Use legacy template explicitly
      const { markdownFilename } = await writePrdArtifacts(prd, questions, {
        outputDir: tmpRoot,
        projectName: prd.project.name,
        templatePath: path.join(process.cwd(), "templates", "PRD_Template.md"),
      });

      const markdown = await fs.readFile(path.join(tmpRoot, markdownFilename), "utf-8");

      // Should use legacy template structure
      expect(markdown).toContain("# Example Project PRD");
      expect(markdown).toContain("### **Summary**");
      expect(markdown).not.toContain("## 0. Document Metadata");
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  });
});

