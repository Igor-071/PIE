import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { collectEvidence, EvidenceMode } from "../src/core/evidenceCollector.js";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

describe("Evidence Collector - Tier Filtering", () => {
  let tempDir: string;
  let repoPath: string;

  beforeEach(async () => {
    // Create a temporary directory for test repo
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pie-test-"));
    repoPath = path.join(tempDir, "test-repo");
    await fs.mkdir(repoPath, { recursive: true });

    // Create test files
    await createTestRepo(repoPath);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createTestRepo(repoPath: string): Promise<void> {
    // Create README
    await fs.writeFile(
      path.join(repoPath, "README.md"),
      "# Test Project\n\nThis is a test healthcare application."
    );

    // Create package.json
    await fs.writeFile(
      path.join(repoPath, "package.json"),
      JSON.stringify({
        name: "test-healthcare-app",
        description: "A healthcare management system",
        version: "1.0.0",
      })
    );

    // Create docs directory
    await fs.mkdir(path.join(repoPath, "docs"), { recursive: true });
    await fs.writeFile(
      path.join(repoPath, "docs", "user-guide.md"),
      "# User Guide\n\nHow to use the app"
    );

    // Create config file
    await fs.writeFile(
      path.join(repoPath, "next.config.js"),
      "module.exports = { reactStrictMode: true };"
    );

    // Create test directory
    await fs.mkdir(path.join(repoPath, "test"), { recursive: true });
    await fs.writeFile(
      path.join(repoPath, "test", "example.test.ts"),
      'describe("test", () => { it("should work", () => {}); });'
    );

    // Create src directory with a component
    await fs.mkdir(path.join(repoPath, "src"), { recursive: true });
    await fs.writeFile(
      path.join(repoPath, "src", "Component.tsx"),
      "interface Props { name: string; }\nexport const Component = ({ name }: Props) => <div>{name}</div>;"
    );
  }

  describe("Tier 2 Mode (Business Strategy)", () => {
    it("should collect only business-relevant evidence", async () => {
      const tier1Data = {
        projectName: "Test Healthcare App",
        screens: [
          { name: "PatientPortal", path: "src/screens/PatientPortal.tsx" },
          { name: "Dashboard", path: "src/screens/Dashboard.tsx" },
        ],
        dataModels: [{ name: "Patient" }, { name: "Appointment" }],
        apiEndpoints: [
          { method: "GET", path: "/api/patients" },
          { method: "POST", path: "/api/appointments" },
        ],
        navigation: [{ path: "/dashboard", label: "Dashboard" }],
        aiMetadata: { stackDetected: ["React", "Next.js"] },
      };

      const evidence = await collectEvidence(
        repoPath,
        { mode: "tier2" as EvidenceMode },
        tier1Data
      );

      // Should include business-relevant evidence
      const evidenceTypes = evidence.map((e) => e.type);
      expect(evidenceTypes).toContain("repo_readme");
      expect(evidenceTypes).toContain("package_metadata");
      expect(evidenceTypes).toContain("repo_docs");
      expect(evidenceTypes).toContain("code_summary");

      // Should NOT include technical evidence
      expect(evidenceTypes).not.toContain("config_file");
      expect(evidenceTypes).not.toContain("test_file");
      expect(evidenceTypes).not.toContain("component_analysis");
      expect(evidenceTypes).not.toContain("code_patterns");
    });

    it("should create minimal code summary for Tier 2", async () => {
      const tier1Data = {
        projectName: "Test App",
        screens: Array.from({ length: 20 }, (_, i) => ({
          name: `Screen${i}`,
          path: `src/screens/Screen${i}.tsx`,
        })),
        dataModels: Array.from({ length: 10 }, (_, i) => ({
          name: `Model${i}`,
        })),
        apiEndpoints: [
          { method: "GET", path: "/api/test" },
          { method: "POST", path: "/api/test" },
        ],
        navigation: [{ path: "/", label: "Home" }],
        aiMetadata: { stackDetected: ["React"] },
      };

      const evidence = await collectEvidence(
        repoPath,
        { mode: "tier2" as EvidenceMode },
        tier1Data
      );

      const codeSummary = evidence.find((e) => e.type === "code_summary");
      expect(codeSummary).toBeDefined();
      expect(codeSummary!.content).toContain("High-Level");
      expect(codeSummary!.content).toContain("20 total");

      // Minimal summary should not include detailed feature groupings
      expect(codeSummary!.content).not.toContain("Feature");
      expect(codeSummary!.content).not.toContain("### ");
      
      // Full summary should include more detailed structure
      const fullEvidence = await collectEvidence(
        repoPath,
        { mode: "full" as EvidenceMode },
        tier1Data
      );
      const fullCodeSummary = fullEvidence.find((e) => e.type === "code_summary");
      // Full summary includes detailed sections like "## Screens & Pages"
      expect(fullCodeSummary!.content).toContain("## Screens & Pages");
    });

    it("should include brief files in Tier 2", async () => {
      const briefText = "This is a healthcare app for managing patient records.";
      const evidence = await collectEvidence(
        repoPath,
        { mode: "tier2" as EvidenceMode, briefText },
        {}
      );

      const briefDoc = evidence.find((e) => e.type === "uploaded_brief");
      expect(briefDoc).toBeDefined();
      expect(briefDoc!.content).toContain("healthcare app");
    });
  });

  describe("Tier 3 Mode (Technical Requirements)", () => {
    it("should collect all evidence including technical details", async () => {
      const tier1Data = {
        projectName: "Test App",
        screens: [{ name: "Home", path: "src/Home.tsx" }],
        dataModels: [{ name: "User" }],
        apiEndpoints: [{ method: "GET", path: "/api/users" }],
        navigation: [{ path: "/", label: "Home" }],
        aiMetadata: { stackDetected: ["React"] },
      };

      const evidence = await collectEvidence(
        repoPath,
        { mode: "tier3" as EvidenceMode },
        tier1Data
      );

      const evidenceTypes = evidence.map((e) => e.type);

      // Should include business evidence
      expect(evidenceTypes).toContain("repo_readme");
      expect(evidenceTypes).toContain("package_metadata");

      // Should ALSO include technical evidence
      expect(evidenceTypes).toContain("config_file");
      expect(evidenceTypes).toContain("test_file");
    });
  });

  describe("Full Mode (Backward Compatibility)", () => {
    it("should collect all evidence when mode is not specified", async () => {
      const tier1Data = {
        projectName: "Test App",
        screens: [{ name: "Home", path: "src/Home.tsx" }],
        dataModels: [],
        apiEndpoints: [],
        navigation: [],
        aiMetadata: { stackDetected: [] },
      };

      // Don't specify mode - should default to "full"
      const evidence = await collectEvidence(repoPath, {}, tier1Data);

      const evidenceTypes = evidence.map((e) => e.type);

      // Should include both business and technical evidence
      expect(evidenceTypes).toContain("repo_readme");
      expect(evidenceTypes).toContain("config_file");
      expect(evidenceTypes).toContain("test_file");
    });
  });

  describe("Evidence Prioritization", () => {
    it("should prioritize brief and README over technical evidence", async () => {
      const briefText = "Important client requirements";
      const tier1Data = {
        projectName: "Test",
        screens: [],
        dataModels: [],
        apiEndpoints: [],
        navigation: [],
        aiMetadata: { stackDetected: [] },
      };

      const evidence = await collectEvidence(
        repoPath,
        { mode: "tier2" as EvidenceMode, briefText },
        tier1Data
      );

      // Brief and README should come first (handled by tokenCounter)
      const firstTwo = evidence.slice(0, 2);
      const types = firstTwo.map((e) => e.type);
      
      // Brief or README should be in the first two
      const hasPriorityDoc = types.some(t => 
        t === "uploaded_brief" || t === "repo_readme" || t === "package_metadata"
      );
      expect(hasPriorityDoc).toBe(true);
    });
  });
});

