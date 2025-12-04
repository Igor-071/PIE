import { promises as fs } from "fs";
import path from "path";
import { parseFile } from "./fileParser.js";
import { validatePath } from "./pathValidator.js";

export type EvidenceType = "repo_readme" | "repo_docs" | "uploaded_brief" | "package_metadata" | "code_summary";

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
}

/**
 * Collects textual evidence from the repository (README, docs, optional brief)
 * @param repoPath - Path to the repository root directory
 * @param options - Options including optional brief text
 * @param tier1Data - Optional Tier 1 data for generating code summary
 * @returns Promise resolving to an array of EvidenceDocument
 */
export async function collectEvidence(
  repoPath: string,
  options: EvidenceCollectorOptions = {},
  tier1Data?: any
): Promise<EvidenceDocument[]> {
  const documents: EvidenceDocument[] = [];

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
  const docsPath = path.join(repoPath, "docs");
  try {
    // Validate docs path stays within repo
    const validatedDocsPath = validatePath("docs", repoPath);
    const entries = await fs.readdir(validatedDocsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const fileName = entry.name.toLowerCase();
        // Only process markdown and text files
        if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
          try {
            // Validate file path stays within docs directory
            const filePath = validatePath(entry.name, validatedDocsPath);
            const content = await fs.readFile(filePath, "utf-8");
            documents.push({
              id: `doc-${entry.name}`,
              type: "repo_docs",
              title: `Documentation: ${entry.name}`,
              content,
              path: filePath,
            });
          } catch {
            // Skip files that can't be read as text or fail path validation
            continue;
          }
        }
      }
    }
  } catch {
    // /docs directory doesn't exist or path validation failed, skip
  }

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
    const codeSummary = buildCodeSummary(tier1Data);
    documents.push({
      id: "code-summary",
      type: "code_summary",
      title: "Codebase Technical Summary",
      content: codeSummary,
    });
  }

  return documents;
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
 */
function buildCodeSummary(tier1Data: any): string {
  let summary = "# Technical Code Analysis\n\n";

  // Project overview
  summary += `## Project: ${tier1Data.projectName}\n\n`;

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
