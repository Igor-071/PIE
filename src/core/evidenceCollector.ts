import { promises as fs } from "fs";
import * as path from "path";
import { parseFile } from "./fileParser.js";
import { validatePath } from "./pathValidator.js";

export type EvidenceType =
  | "repo_readme"
  | "repo_docs"
  | "uploaded_brief"
  | "package_metadata"
  | "code_summary"
  | "config_file"
  | "test_file"
  | "component_analysis"
  | "auth_patterns"
  | "code_patterns"
  | "contracts";

export type EvidenceMode = "tier2" | "tier3" | "full";

export interface EvidenceDocument {
  id: string;
  type: EvidenceType;
  title: string;
  content: string;
  path?: string;
}

export interface EvidenceCollectorOptions {
  briefText?: string | null;
  briefFiles?: string[]; // Array of file paths to parse
  mode?: EvidenceMode; // Default: "full" for backward compatibility
}

/**
 * Collects textual evidence from the repository (README, docs, optional brief)
 * @param repoPath - Path to the repository root directory
 * @param options - Options including optional brief text and evidence mode
 * @param tier1Data - Optional Tier 1 data for generating code summary
 * @returns Promise resolving to an array of EvidenceDocument
 */
export async function collectEvidence(
  repoPath: string,
  options: EvidenceCollectorOptions = {},
  tier1Data?: any
): Promise<EvidenceDocument[]> {
  const documents: EvidenceDocument[] = [];
  const mode = options.mode || "full"; // Default to "full" for backward compatibility
  
  // Tier 2 mode collects only business-relevant evidence
  // Tier 3 mode collects all evidence including technical details
  const includeTechnicalEvidence = mode === "tier3" || mode === "full";

  // Collect package.json metadata
  try {
    const packageJsonPath = path.join(repoPath, "package.json");
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);
    
    // Build a rich metadata summary
    const metadataSummary = buildPackageMetadataSummary(packageJson);
    documents.push({
      id: "package-metadata",
      type: "package_metadata",
      title: "Project Metadata (package.json)",
      content: metadataSummary,
      path: packageJsonPath,
    });
  } catch {
    // package.json not found or invalid, continue
  }

  // Collect README files from repo root
  const readmeNames = ["README.md", "README.txt", "readme.md", "readme.txt"];
  for (const readmeName of readmeNames) {
    try {
      // Validate path stays within repo
      const readmePath = validatePath(readmeName, repoPath);
      const content = await fs.readFile(readmePath, "utf-8");
      documents.push({
        id: `readme-${readmeName}`,
        type: "repo_readme",
        title: `Repository README (${readmeName})`,
        content,
        path: readmePath,
      });
      // Only take the first README found
      break;
    } catch {
      // File doesn't exist or path validation failed, continue
      continue;
    }
  }

  // Collect documentation files from /docs directory
  // Expanded doc directories for real-world repos
  // (keep shallow and size-capped to control token usage)
  await collectDocsFromDirectories(repoPath, documents, [
    "docs",
    "doc",
    "documentation",
    "prd",
    "product",
    "requirements",
    "spec",
    "specs",
    "adr",
    "architecture",
    "design",
  ]);

  // Add uploaded brief text if provided
  if (options.briefText && options.briefText.trim().length > 0) {
    documents.push({
      id: "brief-text",
      type: "uploaded_brief",
      title: "Uploaded brief (text)",
      content: options.briefText.trim(),
    });
  }

  // Parse and add uploaded brief files if provided
  if (options.briefFiles && options.briefFiles.length > 0) {
    for (const filePath of options.briefFiles) {
      try {
        const parsed = await parseFile(filePath);
        documents.push({
          id: `brief-file-${path.basename(filePath)}`,
          type: "uploaded_brief",
          title: `Uploaded brief: ${parsed.fileName}`,
          content: parsed.content,
          path: filePath,
        });
      } catch (error) {
        console.error(`Failed to parse brief file ${filePath}:`, error);
        // Continue with other files even if one fails
      }
    }
  }

  // Generate code summary from Tier 1 data if provided
  if (tier1Data) {
    const codeSummary = buildCodeSummary(tier1Data, mode === "tier2");
    documents.push({
      id: "code-summary",
      type: "code_summary",
      title: "Codebase Technical Summary",
      content: codeSummary,
    });
  }

  // Collect technical evidence only for Tier 3 or full mode
  // Tier 2 focuses on business strategy and doesn't need these technical details
  if (includeTechnicalEvidence) {
  // Collect config files for technical assumptions
  const configFiles = await collectConfigFiles(repoPath);
  documents.push(...configFiles);

  // Analyze test files for acceptance criteria patterns
  const testFiles = await collectTestFiles(repoPath);
  documents.push(...testFiles);

  // Extract component props/types for UI requirements
  const componentAnalysis = await analyzeComponents(repoPath, tier1Data);
  if (componentAnalysis) {
    documents.push(componentAnalysis);
  }

  // Enhanced code analysis: auth patterns, data flow, error handling
  const codePatterns = await analyzeCodePatterns(repoPath, tier1Data);
  if (codePatterns) {
    documents.push(codePatterns);
    }

  // Collect API/data contracts (OpenAPI/GraphQL/schemas/validators)
  const contractEvidence = await collectContractEvidence(repoPath);
  if (contractEvidence) {
    documents.push(contractEvidence);
  }
  }

  return documents;
}

async function collectDocsFromDirectories(
  repoPath: string,
  documents: EvidenceDocument[],
  dirNames: string[]
): Promise<void> {
  const MAX_FILES = 30;
  const MAX_CHARS_PER_FILE = 25_000;

  for (const dirName of dirNames) {
    if (documents.length >= MAX_FILES) return;
    try {
      const validatedDir = validatePath(dirName, repoPath);
      const entries = await fs.readdir(validatedDir, { withFileTypes: true });
      for (const entry of entries) {
        if (documents.length >= MAX_FILES) return;
        if (!entry.isFile()) continue;
        const lower = entry.name.toLowerCase();
        if (!lower.endsWith(".md") && !lower.endsWith(".txt")) continue;
        try {
          const filePath = validatePath(entry.name, validatedDir);
          const raw = await fs.readFile(filePath, "utf-8");
          const content = raw.length > MAX_CHARS_PER_FILE ? raw.slice(0, MAX_CHARS_PER_FILE) + "\n\n... (truncated)" : raw;
          documents.push({
            id: `doc-${dirName}-${entry.name}`,
            type: "repo_docs",
            title: `Documentation (${dirName}): ${entry.name}`,
            content,
            path: filePath,
          });
        } catch {
          continue;
        }
      }
    } catch {
      // directory doesn't exist or not readable
      continue;
    }
  }
}

async function collectContractEvidence(repoPath: string): Promise<EvidenceDocument | null> {
  const MAX_FILES = 12;
  const MAX_CHARS_PER_FILE = 8_000;

  const candidateFiles: string[] = [];

  async function traverse(dirPath: string, depth: number): Promise<void> {
    if (candidateFiles.length >= MAX_FILES) return;
    if (depth > 4) return;

    let entries: any[];
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (candidateFiles.length >= MAX_FILES) return;

      // Skip heavy/irrelevant directories
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "build") {
          continue;
        }
        if (entry.name.startsWith(".")) continue;

        const next = path.join(dirPath, entry.name);
        await traverse(next, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;

      const name = entry.name.toLowerCase();
      const looksLikeContract =
        name.includes("openapi") ||
        name.includes("swagger") ||
        name.includes("api-spec") ||
        name.includes("contract") ||
        name.endsWith(".graphql") ||
        name.endsWith(".gql") ||
        name.endsWith(".proto") ||
        name.endsWith(".schema.json") ||
        name.endsWith(".jsonschema") ||
        name.endsWith(".openapi.json") ||
        name.endsWith(".openapi.yaml") ||
        name.endsWith(".openapi.yml") ||
        name === "openapi.json" ||
        name === "openapi.yaml" ||
        name === "openapi.yml" ||
        name === "swagger.json" ||
        name === "swagger.yaml" ||
        name === "swagger.yml";

      if (!looksLikeContract) continue;
      candidateFiles.push(path.relative(repoPath, path.join(dirPath, entry.name)));
    }
  }

  await traverse(repoPath, 0);
  if (candidateFiles.length === 0) return null;

  let content = "# Contracts & Schemas Detected\n\n";
  content += `Found ${candidateFiles.length} potential contract/schema file(s). Showing up to ${MAX_FILES}.\n\n`;

  for (const rel of candidateFiles.slice(0, MAX_FILES)) {
    try {
      const abs = validatePath(rel, repoPath);
      const raw = await fs.readFile(abs, "utf-8");
      const snippet = raw.length > MAX_CHARS_PER_FILE ? raw.slice(0, MAX_CHARS_PER_FILE) + "\n\n... (truncated)" : raw;
      content += `## ${rel}\n\n`;
      content += "```text\n";
      content += snippet;
      content += "\n```\n\n";
    } catch {
      continue;
    }
  }

  return {
    id: "contracts-evidence",
    type: "contracts",
    title: "Contracts & Schemas (OpenAPI/GraphQL/JSON Schema/etc.)",
    content,
  };
}

/**
 * Builds a rich metadata summary from package.json
 */
function buildPackageMetadataSummary(packageJson: any): string {
  let summary = "";

  if (packageJson.name) {
    summary += `**Project Name:** ${packageJson.name}\n\n`;
  }

  if (packageJson.description) {
    summary += `**Description:** ${packageJson.description}\n\n`;
  }

  if (packageJson.version) {
    summary += `**Version:** ${packageJson.version}\n\n`;
  }

  if (packageJson.keywords && packageJson.keywords.length > 0) {
    summary += `**Keywords:** ${packageJson.keywords.join(", ")}\n\n`;
  }

  if (packageJson.license) {
    summary += `**License:** ${packageJson.license}\n\n`;
  }

  // Analyze dependencies to infer tech stack and purpose
  if (packageJson.dependencies) {
    const deps = Object.keys(packageJson.dependencies);
    summary += `**Key Dependencies (${deps.length} total):**\n`;

    // Categorize dependencies
    const frameworks = deps.filter((d) =>
      ["react", "next", "vue", "angular", "svelte", "express", "fastify", "koa"].includes(d)
    );
    const uiLibs = deps.filter((d) =>
      ["@radix-ui", "@mui", "antd", "chakra-ui", "tailwindcss"].some((lib) => d.includes(lib))
    );
    const stateManagement = deps.filter((d) =>
      ["redux", "zustand", "recoil", "mobx", "jotai", "@tanstack/react-query"].includes(d)
    );
    const databases = deps.filter((d) =>
      ["prisma", "mongoose", "typeorm", "sequelize", "@supabase"].some((lib) => d.includes(lib))
    );
    const auth = deps.filter((d) =>
      ["next-auth", "@auth", "passport", "clerk", "supabase", "firebase"].some((lib) => d.includes(lib))
    );

    if (frameworks.length > 0) summary += `  - Frameworks: ${frameworks.join(", ")}\n`;
    if (uiLibs.length > 0) summary += `  - UI Libraries: ${uiLibs.join(", ")}\n`;
    if (stateManagement.length > 0) summary += `  - State Management: ${stateManagement.join(", ")}\n`;
    if (databases.length > 0) summary += `  - Database/ORM: ${databases.join(", ")}\n`;
    if (auth.length > 0) summary += `  - Authentication: ${auth.join(", ")}\n`;

    summary += "\n";
  }

  // Infer domain from dependencies
  const allDeps = packageJson.dependencies
    ? Object.keys(packageJson.dependencies).join(" ")
    : "";
  let inferredDomain = "";

  if (allDeps.includes("stripe") || allDeps.includes("payment")) {
    inferredDomain += "E-commerce/Payments, ";
  }
  if (allDeps.includes("calendar") || allDeps.includes("scheduler")) {
    inferredDomain += "Scheduling/Calendar, ";
  }
  if (allDeps.includes("chart") || allDeps.includes("graph") || allDeps.includes("analytics")) {
    inferredDomain += "Analytics/Data Visualization, ";
  }
  if (allDeps.includes("medical") || allDeps.includes("health") || allDeps.includes("clinic")) {
    inferredDomain += "Healthcare/Medical, ";
  }

  if (inferredDomain) {
    summary += `**Inferred Domain:** ${inferredDomain.slice(0, -2)}\n\n`;
  }

  return summary;
}

/**
 * Builds a code summary from Tier 1 technical data
 * @param tier1Data - Tier 1 technical data
 * @param minimal - If true, creates a condensed summary for business strategy analysis
 */
function buildCodeSummary(tier1Data: any, minimal: boolean = false): string {
  let summary = "# Technical Code Analysis\n\n";

  // Project overview
  summary += `## Project: ${tier1Data.projectName}\n\n`;
  
  // For Tier 2 (business strategy), provide only high-level overview
  if (minimal) {
    return buildMinimalCodeSummary(tier1Data);
  }

  // Screens/Pages summary
  if (tier1Data.screens && tier1Data.screens.length > 0) {
    summary += `## Screens & Pages (${tier1Data.screens.length} total)\n\n`;

    // Group screens by apparent feature area
    const featureGroups: Record<string, string[]> = {};
    for (const screen of tier1Data.screens) {
      // Extract feature from path or name
      let feature = "General";
      if (screen.path.includes("/patient")) feature = "Patient Management";
      else if (screen.path.includes("/admin")) feature = "Administration";
      else if (screen.path.includes("/auth") || screen.path.includes("/login")) feature = "Authentication";
      else if (screen.path.includes("/dashboard")) feature = "Dashboard";
      else if (screen.path.includes("/setting")) feature = "Settings";
      else if (screen.path.includes("/report")) feature = "Reporting";
      else if (screen.path.includes("/inventory") || screen.path.includes("/stock")) feature = "Inventory";
      else if (screen.path.includes("/schedule") || screen.path.includes("/calendar") || screen.path.includes("/appointment")) feature = "Scheduling";
      else if (screen.name.toLowerCase().includes("patient")) feature = "Patient Management";
      else if (screen.name.toLowerCase().includes("inventory")) feature = "Inventory";
      else if (screen.name.toLowerCase().includes("schedule") || screen.name.toLowerCase().includes("appointment")) feature = "Scheduling";

      if (!featureGroups[feature]) featureGroups[feature] = [];
      featureGroups[feature].push(screen.name);
    }

    for (const [feature, screens] of Object.entries(featureGroups)) {
      summary += `### ${feature}\n`;
      summary += screens.slice(0, 10).map((s) => `- ${s}`).join("\n") + "\n";
      if (screens.length > 10) {
        summary += `  ...and ${screens.length - 10} more\n`;
      }
      summary += "\n";
    }
  }

  // Data Models summary
  if (tier1Data.dataModels && tier1Data.dataModels.length > 0) {
    summary += `## Data Models (${tier1Data.dataModels.length} total)\n\n`;
    const modelNames = tier1Data.dataModels.map((m: any) => m.name);
    summary += modelNames.slice(0, 15).join(", ");
    if (modelNames.length > 15) {
      summary += `, ...and ${modelNames.length - 15} more`;
    }
    summary += "\n\n";
  }

  // Navigation structure
  if (tier1Data.navigation && tier1Data.navigation.length > 0) {
    summary += `## Navigation Structure (${tier1Data.navigation.length} routes)\n\n`;
    for (const nav of tier1Data.navigation.slice(0, 15)) {
      summary += `- ${nav.label}: \`${nav.path}\`\n`;
    }
    if (tier1Data.navigation.length > 15) {
      summary += `  ...and ${tier1Data.navigation.length - 15} more routes\n`;
    }
    summary += "\n";
  }

  // API Endpoints summary
  if (tier1Data.apiEndpoints && tier1Data.apiEndpoints.length > 0) {
    summary += `## API Endpoints (${tier1Data.apiEndpoints.length} total)\n\n`;
    const groupedByMethod: Record<string, string[]> = {};
    for (const endpoint of tier1Data.apiEndpoints) {
      if (!groupedByMethod[endpoint.method]) groupedByMethod[endpoint.method] = [];
      groupedByMethod[endpoint.method].push(endpoint.path);
    }
    for (const [method, paths] of Object.entries(groupedByMethod)) {
      summary += `**${method}:** ${paths.slice(0, 5).join(", ")}`;
      if (paths.length > 5) summary += `, ...and ${paths.length - 5} more`;
      summary += "\n";
    }
    summary += "\n";
  }

  // State Management
  if (tier1Data.statePatterns && tier1Data.statePatterns.length > 0) {
    summary += `## State Management\n\n`;
    const stateTypes = [...new Set(tier1Data.statePatterns.map((s: any) => s.type))];
    summary += `Used patterns: ${stateTypes.join(", ")}\n\n`;
  }

  // Tech Stack
  if (tier1Data.aiMetadata && tier1Data.aiMetadata.stackDetected) {
    summary += `## Technology Stack\n\n`;
    summary += tier1Data.aiMetadata.stackDetected.join(", ") + "\n\n";
  }

  return summary;
}

/**
 * Builds a minimal code summary focused on business insights
 * Used for Tier 2 (business strategy) to reduce token count
 */
function buildMinimalCodeSummary(tier1Data: any): string {
  let summary = "# Codebase Overview (High-Level)\n\n";
  
  summary += `**Project:** ${tier1Data.projectName}\n\n`;
  
  // Screens summary - just counts and key names for inferring personas
  if (tier1Data.screens && tier1Data.screens.length > 0) {
    summary += `**Screens/Pages:** ${tier1Data.screens.length} total\n`;
    const screenNames = tier1Data.screens.slice(0, 15).map((s: any) => s.name);
    summary += `Key screens: ${screenNames.join(", ")}\n`;
    if (tier1Data.screens.length > 15) {
      summary += `...and ${tier1Data.screens.length - 15} more\n`;
    }
    summary += "\n";
  }
  
  // Data models - just names for domain inference
  if (tier1Data.dataModels && tier1Data.dataModels.length > 0) {
    summary += `**Data Models:** ${tier1Data.dataModels.length} total\n`;
    const modelNames = tier1Data.dataModels.slice(0, 20).map((m: any) => m.name);
    summary += `Models: ${modelNames.join(", ")}\n`;
    if (tier1Data.dataModels.length > 20) {
      summary += `...and ${tier1Data.dataModels.length - 20} more\n`;
    }
    summary += "\n";
  }
  
  // API endpoints - just summary for feature inference
  if (tier1Data.apiEndpoints && tier1Data.apiEndpoints.length > 0) {
    summary += `**API Endpoints:** ${tier1Data.apiEndpoints.length} total\n`;
    const methods = tier1Data.apiEndpoints.reduce((acc: any, ep: any) => {
      acc[ep.method] = (acc[ep.method] || 0) + 1;
      return acc;
    }, {});
    summary += `Methods: ${Object.entries(methods).map(([m, c]) => `${m}(${c})`).join(", ")}\n`;
    
    // Show a few example endpoints for feature inference
    const exampleEndpoints = tier1Data.apiEndpoints.slice(0, 5).map((ep: any) => `${ep.method} ${ep.path}`);
    summary += `Examples: ${exampleEndpoints.join(", ")}\n\n`;
  }
  
  // Navigation - just count and key routes
  if (tier1Data.navigation && tier1Data.navigation.length > 0) {
    summary += `**Navigation Routes:** ${tier1Data.navigation.length} total\n`;
    const keyRoutes = tier1Data.navigation.slice(0, 8).map((n: any) => n.path);
    summary += `Key routes: ${keyRoutes.join(", ")}\n\n`;
  }
  
  // Tech stack
  if (tier1Data.aiMetadata && tier1Data.aiMetadata.stackDetected) {
    summary += `**Tech Stack:** ${tier1Data.aiMetadata.stackDetected.join(", ")}\n\n`;
  }

  return summary;
}

/**
 * Collects configuration files for technical assumptions
 */
async function collectConfigFiles(repoPath: string): Promise<EvidenceDocument[]> {
  const documents: EvidenceDocument[] = [];
  const configPatterns = [
    ".env",
    ".env.local",
    ".env.production",
    "config.ts",
    "config.js",
    "next.config.ts",
    "next.config.js",
    "vite.config.ts",
    "vite.config.js",
    "webpack.config.js",
    "tsconfig.json",
    "tailwind.config.js",
    "tailwind.config.ts",
  ];

  for (const configName of configPatterns) {
    try {
      const configPath = validatePath(configName, repoPath);
      const content = await fs.readFile(configPath, "utf-8");
      
      // Extract key information from config files
      let summary = `# Configuration: ${configName}\n\n`;
      summary += "```\n";
      summary += content.substring(0, 5000); // Limit size
      if (content.length > 5000) {
        summary += "\n... (truncated)";
      }
      summary += "\n```\n\n";
      
      // Analyze config for key insights
      const insights = analyzeConfigContent(configName, content);
      if (insights) {
        summary += `## Key Insights\n\n${insights}\n`;
      }

      documents.push({
        id: `config-${configName}`,
        type: "config_file",
        title: `Configuration: ${configName}`,
        content: summary,
        path: configPath,
      });
    } catch {
      // File doesn't exist, continue
      continue;
    }
  }

  return documents;
}

/**
 * Analyzes config file content for key technical insights
 */
function analyzeConfigContent(configName: string, content: string): string {
  const insights: string[] = [];
  const lowerContent = content.toLowerCase();

  // Detect hosting providers
  if (lowerContent.includes("vercel") || lowerContent.includes("vercel.com")) {
    insights.push("- Hosting: Vercel");
  }
  if (lowerContent.includes("netlify") || lowerContent.includes("netlify.com")) {
    insights.push("- Hosting: Netlify");
  }
  if (lowerContent.includes("aws") || lowerContent.includes("amazon")) {
    insights.push("- Hosting: AWS");
  }
  if (lowerContent.includes("supabase")) {
    insights.push("- Database/Auth: Supabase");
  }
  if (lowerContent.includes("firebase")) {
    insights.push("- Database/Auth: Firebase");
  }
  if (lowerContent.includes("mongodb") || lowerContent.includes("mongo")) {
    insights.push("- Database: MongoDB");
  }
  if (lowerContent.includes("postgres") || lowerContent.includes("postgresql")) {
    insights.push("- Database: PostgreSQL");
  }
  if (lowerContent.includes("stripe")) {
    insights.push("- Payment: Stripe");
  }
  if (lowerContent.includes("sendgrid") || lowerContent.includes("ses")) {
    insights.push("- Email Service: Detected");
  }
  if (lowerContent.includes("i18n") || lowerContent.includes("locale") || lowerContent.includes("language")) {
    insights.push("- Internationalization: Enabled");
  }

  return insights.length > 0 ? insights.join("\n") : "";
}

/**
 * Collects and analyzes test files for acceptance criteria patterns
 */
async function collectTestFiles(repoPath: string): Promise<EvidenceDocument[]> {
  const documents: EvidenceDocument[] = [];
  const testPatterns = ["**/*.test.ts", "**/*.test.tsx", "**/*.test.js", "**/*.test.jsx", "**/*.spec.ts", "**/*.spec.tsx"];

  try {
    // Use manual directory traversal to find test files
    const testFiles = await findTestFilesManually(repoPath);

    if (testFiles.length === 0) {
      return documents;
    }

    // Analyze test files for acceptance criteria
    const acceptanceCriteria: string[] = [];
    const testSummaries: string[] = [];

    for (const testFile of testFiles.slice(0, 20)) { // Limit to first 20 test files
      try {
        const testPath = validatePath(testFile, repoPath);
        const content = await fs.readFile(testPath, "utf-8");
        
        // Extract test descriptions and expectations
        const testMatches = content.match(/(?:it|test|describe)\(['"]([^'"]+)['"]/g);
        if (testMatches) {
          testSummaries.push(`### ${path.basename(testFile)}\n`);
          testMatches.forEach((match) => {
            const description = match.match(/['"]([^'"]+)['"]/)?.[1];
            if (description) {
              testSummaries.push(`- ${description}`);
              acceptanceCriteria.push(description);
            }
          });
          testSummaries.push("");
        }
      } catch {
        // Skip files that can't be read
        continue;
      }
    }

    if (testSummaries.length > 0) {
      let testContent = "# Test Files Analysis\n\n";
      testContent += `Found ${testFiles.length} test files. Analyzed ${Math.min(testFiles.length, 20)}.\n\n`;
      testContent += testSummaries.join("\n");
      testContent += "\n## Extracted Acceptance Criteria Patterns\n\n";
      testContent += acceptanceCriteria.slice(0, 50).map((criteria) => `- ${criteria}`).join("\n");

      documents.push({
        id: "test-analysis",
        type: "test_file",
        title: "Test Files Analysis & Acceptance Criteria",
        content: testContent,
      });
    }
  } catch (error) {
    // If glob is not available or fails, try manual search
    const testDir = path.join(repoPath, "test");
    try {
      const entries = await fs.readdir(testDir, { withFileTypes: true });
      const testFiles: string[] = [];
      
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.includes(".test.") || entry.name.includes(".spec."))) {
          testFiles.push(entry.name);
        }
      }

      if (testFiles.length > 0) {
        let testContent = `# Test Files Found\n\nFound ${testFiles.length} test files in /test directory.\n\n`;
        testContent += testFiles.map((f) => `- ${f}`).join("\n");
        
        documents.push({
          id: "test-analysis",
          type: "test_file",
          title: "Test Files Found",
          content: testContent,
        });
      }
    } catch {
      // Test directory doesn't exist, skip
    }
  }

  return documents;
}

/**
 * Manually finds test files by traversing directories
 */
async function findTestFilesManually(repoPath: string): Promise<string[]> {
  const testFiles: string[] = [];
  
  async function traverseDir(dirPath: string, relativePath: string = ""): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip node_modules and other ignored directories
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name.startsWith(".")) {
          continue;
        }
        
        const fullPath = path.join(dirPath, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          await traverseDir(fullPath, relativeFilePath);
        } else if (entry.isFile()) {
          const fileName = entry.name.toLowerCase();
          if (fileName.includes(".test.") || fileName.includes(".spec.")) {
            testFiles.push(relativeFilePath);
          }
        }
      }
    } catch {
      // Skip directories that can't be read
      return;
    }
  }
  
  await traverseDir(repoPath);
  return testFiles;
}

/**
 * Analyzes component files for UI requirements and props
 */
async function analyzeComponents(repoPath: string, tier1Data?: any): Promise<EvidenceDocument | null> {
  if (!tier1Data?.screens || tier1Data.screens.length === 0) {
    return null;
  }

  const componentProps: string[] = [];
  const uiPatterns: string[] = [];
  const formFields: string[] = [];

  // Analyze component files from screen paths
  for (const screen of tier1Data.screens.slice(0, 30)) {
    try {
      if (!screen.path) continue;
      
      const screenPath = validatePath(screen.path, repoPath);
      const content = await fs.readFile(screenPath, "utf-8");

      // Extract TypeScript interfaces and props
      const interfaceMatches = content.match(/interface\s+(\w+Props?)\s*\{([^}]+)\}/gs);
      if (interfaceMatches) {
        interfaceMatches.forEach((match) => {
          const interfaceName = match.match(/interface\s+(\w+Props?)/)?.[1];
          const fields = match.match(/\{([^}]+)\}/)?.[1];
          if (interfaceName && fields) {
            componentProps.push(`### ${interfaceName}\n${fields.trim()}\n`);
            
            // Extract form fields
            const fieldMatches = fields.match(/(\w+)\??\s*:\s*(\w+)/g);
            if (fieldMatches) {
              fieldMatches.forEach((fieldMatch) => {
                const fieldName = fieldMatch.match(/(\w+)/)?.[1];
                if (fieldName && !formFields.includes(fieldName)) {
                  formFields.push(fieldName);
                }
              });
            }
          }
        });
      }

      // Detect UI patterns
      if (content.includes("useState") || content.includes("useReducer")) {
        uiPatterns.push("State Management: React Hooks");
      }
      if (content.includes("onSubmit") || content.includes("handleSubmit")) {
        uiPatterns.push("Form Handling: Detected");
      }
      if (content.includes("validation") || content.includes("validate")) {
        uiPatterns.push("Form Validation: Detected");
      }
      if (content.includes("error") && content.includes("catch")) {
        uiPatterns.push("Error Handling: Detected");
      }
    } catch {
      // Skip files that can't be read
      continue;
    }
  }

  if (componentProps.length === 0 && uiPatterns.length === 0) {
    return null;
  }

  let analysis = "# Component Analysis\n\n";
  
  if (componentProps.length > 0) {
    analysis += "## Component Props & Types\n\n";
    analysis += componentProps.slice(0, 20).join("\n");
    analysis += "\n\n";
  }

  if (formFields.length > 0) {
    analysis += `## Form Fields Detected (${formFields.length})\n\n`;
    analysis += formFields.slice(0, 30).map((f) => `- ${f}`).join("\n");
    analysis += "\n\n";
  }

  if (uiPatterns.length > 0) {
    analysis += "## UI Patterns Detected\n\n";
    analysis += [...new Set(uiPatterns)].map((p) => `- ${p}`).join("\n");
  }

  return {
    id: "component-analysis",
    type: "component_analysis",
    title: "Component & UI Requirements Analysis",
    content: analysis,
  };
}

/**
 * Analyzes code patterns: auth, data flow, error handling
 */
async function analyzeCodePatterns(repoPath: string, tier1Data?: any): Promise<EvidenceDocument | null> {
  const patterns: {
    auth: string[];
    dataFlow: string[];
    errorHandling: string[];
    rbac: string[];
  } = {
    auth: [],
    dataFlow: [],
    errorHandling: [],
    rbac: [],
  };

  // Analyze from tier1Data if available
  if (tier1Data) {
    // Check for auth patterns in API endpoints
    if (tier1Data.apiEndpoints) {
      tier1Data.apiEndpoints.forEach((endpoint: any) => {
        if (endpoint.authRequired || endpoint.endpoint?.includes("auth") || endpoint.endpoint?.includes("login")) {
          patterns.auth.push(`API: ${endpoint.method} ${endpoint.endpoint}`);
        }
      });
    }

    // Check for role-based patterns in screens
    if (tier1Data.screens) {
      const roleScreens = tier1Data.screens.filter((s: any) => 
        s.name?.toLowerCase().includes("admin") || 
        s.name?.toLowerCase().includes("patient") ||
        s.name?.toLowerCase().includes("provider") ||
        s.path?.includes("/admin") ||
        s.path?.includes("/patient")
      );
      
      if (roleScreens.length > 0) {
        patterns.rbac.push(`Role-based screens detected: ${roleScreens.length} screens`);
        patterns.rbac.push(...roleScreens.slice(0, 10).map((s: any) => `- ${s.name}`));
      }
    }

    // Check state management patterns
    if (tier1Data.statePatterns) {
      tier1Data.statePatterns.forEach((pattern: any) => {
        patterns.dataFlow.push(`State Pattern: ${pattern.type}`);
      });
    }
  }

  // Try to analyze auth files directly
  try {
    const authFiles = [
      "src/lib/auth.ts",
      "src/utils/auth.ts",
      "src/auth.ts",
      "src/middleware.ts",
      "middleware.ts",
    ];

    for (const authFile of authFiles) {
      try {
        const authPath = validatePath(authFile, repoPath);
        const content = await fs.readFile(authPath, "utf-8");
        
        if (content.includes("role") || content.includes("permission")) {
          patterns.rbac.push(`RBAC pattern detected in ${authFile}`);
        }
        if (content.includes("jwt") || content.includes("token")) {
          patterns.auth.push(`JWT authentication detected`);
        }
        if (content.includes("session")) {
          patterns.auth.push(`Session-based authentication detected`);
        }
        break;
      } catch {
        continue;
      }
    }
  } catch {
    // Continue if analysis fails
  }

  // Check for error handling patterns in common files
  try {
    const commonFiles = [
      "src/utils/error.ts",
      "src/lib/error.ts",
      "src/error.ts",
    ];

    for (const errorFile of commonFiles) {
      try {
        const errorPath = validatePath(errorFile, repoPath);
        const content = await fs.readFile(errorPath, "utf-8");
        
        if (content.includes("try") && content.includes("catch")) {
          patterns.errorHandling.push(`Error handling utilities in ${errorFile}`);
        }
        break;
      } catch {
        continue;
      }
    }
  } catch {
    // Continue if analysis fails
  }

  // Build summary
  const hasPatterns = patterns.auth.length > 0 || 
                      patterns.dataFlow.length > 0 || 
                      patterns.errorHandling.length > 0 || 
                      patterns.rbac.length > 0;

  if (!hasPatterns) {
    return null;
  }

  let analysis = "# Code Patterns Analysis\n\n";

  if (patterns.auth.length > 0) {
    analysis += "## Authentication Patterns\n\n";
    analysis += patterns.auth.map((p) => `- ${p}`).join("\n");
    analysis += "\n\n";
  }

  if (patterns.rbac.length > 0) {
    analysis += "## Role-Based Access Control (RBAC)\n\n";
    analysis += patterns.rbac.map((p) => `- ${p}`).join("\n");
    analysis += "\n\n";
  }

  if (patterns.dataFlow.length > 0) {
    analysis += "## Data Flow Patterns\n\n";
    analysis += patterns.dataFlow.map((p) => `- ${p}`).join("\n");
    analysis += "\n\n";
  }

  if (patterns.errorHandling.length > 0) {
    analysis += "## Error Handling Patterns\n\n";
    analysis += patterns.errorHandling.map((p) => `- ${p}`).join("\n");
  }

  return {
    id: "code-patterns",
    type: "code_patterns",
    title: "Code Patterns Analysis (Auth, RBAC, Data Flow, Error Handling)",
    content: analysis,
  };
}
