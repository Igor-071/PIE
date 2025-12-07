import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import AdmZip from "adm-zip";

describe("PRD Generation Pipeline - Integration Tests", () => {
  let testZipPath: string;
  let testOutputDir: string;
  let unzippedPath: string;
  
  // Import functions - using dynamic imports to avoid compiled .js files in src/
  let unzipRepository: typeof import("../../src/core/unzipRepo.js").unzipRepository;
  let extractTier1: typeof import("../../src/core/tier1Extractor.js").extractTier1;
  let collectEvidence: typeof import("../../src/core/evidenceCollector.js").collectEvidence;
  let buildInitialPrdJsonFromTier1: typeof import("../../src/core/jsonMerger.js").buildInitialPrdJsonFromTier1;
  let cleanupDirectory: typeof import("../../src/core/cleanup.js").cleanupDirectory;

  beforeAll(async () => {
    // Import TypeScript source files directly (using .ts extension)
    const unzipRepo = await import("../../src/core/unzipRepo.ts");
    const tier1Extractor = await import("../../src/core/tier1Extractor.ts");
    const evidenceCollector = await import("../../src/core/evidenceCollector.ts");
    const jsonMerger = await import("../../src/core/jsonMerger.ts");
    const cleanup = await import("../../src/core/cleanup.ts");
    
    unzipRepository = unzipRepo.unzipRepository;
    extractTier1 = tier1Extractor.extractTier1;
    collectEvidence = evidenceCollector.collectEvidence;
    buildInitialPrdJsonFromTier1 = jsonMerger.buildInitialPrdJsonFromTier1;
    cleanupDirectory = cleanup.cleanupDirectory;

    // Create a minimal test repository structure
    // Create a minimal test repository structure
    const testRepoDir = path.join(process.cwd(), "tmp", "test-repo-integration");
    await fs.mkdir(testRepoDir, { recursive: true });

    // Create package.json
    await fs.writeFile(
      path.join(testRepoDir, "package.json"),
      JSON.stringify({
        name: "test-app",
        version: "1.0.0",
        description: "Test application for integration tests",
      })
    );

    // Create README.md
    await fs.writeFile(
      path.join(testRepoDir, "README.md"),
      "# Test App\n\nA simple test application for integration testing."
    );

    // Create a simple React component
    const srcDir = path.join(testRepoDir, "src");
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, "App.tsx"),
      `import React from 'react';

export default function App() {
  return <div>Test App</div>;
}`
    );

    // Create a page
    const pagesDir = path.join(srcDir, "pages");
    await fs.mkdir(pagesDir, { recursive: true });
    await fs.writeFile(
      path.join(pagesDir, "Home.tsx"),
      `import React from 'react';

export default function Home() {
  return <div>Home Page</div>;
}`
    );

    // Create ZIP file
    const zip = new AdmZip();
    zip.addLocalFolder(testRepoDir);
    testZipPath = path.join(process.cwd(), "tmp", "test-repo-integration.zip");
    await fs.mkdir(path.dirname(testZipPath), { recursive: true });
    zip.writeZip(testZipPath);

    // Clean up source directory
    await cleanupDirectory(testRepoDir);

    // Create output directory
    testOutputDir = path.join(process.cwd(), "tmp", "test-output-integration");
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test files
    try {
      if (testZipPath) await fs.unlink(testZipPath);
      if (unzippedPath) await cleanupDirectory(unzippedPath);
      if (testOutputDir) await cleanupDirectory(testOutputDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it("should unzip repository successfully", async () => {
    unzippedPath = await unzipRepository(testZipPath);
    
    expect(unzippedPath).toBeTruthy();
    const exists = await fs.access(unzippedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it("should extract Tier 1 data from repository", async () => {
    if (!unzippedPath) {
      unzippedPath = await unzipRepository(testZipPath);
    }

    const tier1 = await extractTier1(unzippedPath);

    expect(tier1).toBeDefined();
    expect(tier1.projectName).toBeTruthy();
    expect(tier1.screens).toBeInstanceOf(Array);
    expect(tier1.apiEndpoints).toBeInstanceOf(Array);
    expect(tier1.dataModels).toBeDefined();
  });

  it("should collect evidence from repository", async () => {
    if (!unzippedPath) {
      unzippedPath = await unzipRepository(testZipPath);
    }

    const tier1 = await extractTier1(unzippedPath);
    const evidence = await collectEvidence(unzippedPath, { briefText: null }, tier1);

    expect(evidence).toBeInstanceOf(Array);
    expect(evidence.length).toBeGreaterThan(0);
    
    // Should have README evidence
    const readmeEvidence = evidence.find(e => e.type === "repo_readme");
    expect(readmeEvidence).toBeDefined();
  });

  it("should build initial PRD JSON from Tier 1 data", async () => {
    if (!unzippedPath) {
      unzippedPath = await unzipRepository(testZipPath);
    }

    const tier1 = await extractTier1(unzippedPath);
    const baseJson = buildInitialPrdJsonFromTier1(tier1);

    expect(baseJson).toBeDefined();
    expect(baseJson.project).toBeDefined();
    expect(baseJson.project.name).toBe(tier1.projectName);
    expect(baseJson.screens).toBeInstanceOf(Array);
    expect(baseJson.api).toBeInstanceOf(Array);
  });

  it("should handle brief text in evidence collection", async () => {
    if (!unzippedPath) {
      unzippedPath = await unzipRepository(testZipPath);
    }

    const briefText = "This is a test brief for the application.";
    const tier1 = await extractTier1(unzippedPath);
    const evidence = await collectEvidence(unzippedPath, { briefText }, tier1);

    // Should include brief evidence
    const briefEvidence = evidence.find(e => e.type === "uploaded_brief");
    expect(briefEvidence).toBeDefined();
    expect(briefEvidence?.content).toContain("test brief");
  });

  it("should handle invalid ZIP file gracefully", async () => {
    const invalidZipPath = path.join(process.cwd(), "tmp", "invalid.zip");
    await fs.writeFile(invalidZipPath, "not a zip file");

    await expect(unzipRepository(invalidZipPath)).rejects.toThrow();
    
    // Clean up
    await fs.unlink(invalidZipPath);
  });

  it("should handle non-existent ZIP file", async () => {
    const nonExistentPath = path.join(process.cwd(), "tmp", "nonexistent.zip");
    
    await expect(unzipRepository(nonExistentPath)).rejects.toThrow();
  });
});
