import { promises as fs } from "fs";
import path from "path";
import {
  PrdJson,
  Screen,
  ApiEndpoint,
  Navigation,
  Event,
  AiMetadata,
} from "../models/schema.js";
import { scanRepository } from "./repoScanner.js";
import { extractNavigation } from "./navigationExtractor.js";
import { detectApiEndpoints } from "./apiDetector.js";
import { detectDataModels } from "./dataModelDetector.js";
import { detectStatePatterns } from "./statePatternDetector.js";
import { detectEvents } from "./eventDetector.js";
import { generateId, generateIdFromString, inferScreenPurpose } from "./utils.js";

/**
 * Extracts project name from package.json, README, or directory name
 * @param repoPath - Path to the repository directory
 * @param allFiles - List of all files in the repository
 * @returns Project name
 */
async function extractProjectName(repoPath: string, allFiles: string[]): Promise<string> {
  // Try 1: Read package.json
  try {
    const packageJsonPath = path.join(repoPath, "package.json");
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);
    if (packageJson.name && typeof packageJson.name === "string") {
      // Clean up scoped package names (e.g., "@company/project" -> "Project")
      const name = packageJson.name.replace(/^@[^/]+\//, "");
      // Convert kebab-case to Title Case
      return name
        .split("-")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  } catch (error) {
    // package.json not found or invalid, continue to fallback
  }

  // Try 2: Parse README title
  const readmeFiles = allFiles.filter((f) =>
    f.match(/^README\.(md|txt)$/i)
  );
  for (const readmeFile of readmeFiles) {
    try {
      const readmePath = path.join(repoPath, readmeFile);
      const readmeContent = await fs.readFile(readmePath, "utf-8");
      // Look for first # heading
      const match = readmeContent.match(/^#\s+(.+)$/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    } catch (error) {
      // Continue to next README or fallback
    }
  }

  // Try 3: Clean up directory name
  const dirName = path.basename(repoPath);
  return dirName
    .replace(/^repo-/, "")
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Extracts Tier 1 technical data from a repository and returns PrdJson
 * @param repoPath - Path to the unzipped repository directory
 * @returns Promise resolving to PrdJson
 */
export async function extractTier1(repoPath: string): Promise<PrdJson> {
  // Scan the repository for files
  const scanned = await scanRepository(repoPath);

  // Extract project name from package.json, README, or directory
  const projectName = await extractProjectName(repoPath, scanned.allFiles);

  // Build screens from discovered page/screen files
  const screens: Screen[] = scanned.screens.map((filePath) => {
    const name = path.basename(filePath, path.extname(filePath));
    // Detect framework from file path or extension
    let framework: string | undefined;
    if (filePath.includes("/app/") || filePath.includes("/pages/api/")) {
      framework = "nextjs";
    } else if (filePath.includes("/src/pages/")) {
      framework = "react";
    } else if (filePath.includes("/screens/")) {
      framework = "react-native";
    }

    return {
      id: generateIdFromString(filePath),
      name,
      path: filePath,
      purpose: inferScreenPurpose(name, filePath),
      framework,
    };
  });

  // Extract navigation structure
  const navigation: Navigation[] = await extractNavigation(
    repoPath,
    scanned.screens
  );

  // Detect API endpoints from both route files and code calls
  const apiEndpoints: ApiEndpoint[] = await detectApiEndpoints(repoPath, scanned.allFiles);

  // Detect data models from TypeScript interfaces, types, and schemas
  const dataModel = await detectDataModels(repoPath, scanned.allFiles);

  // Detect state management patterns
  const statePatterns = await detectStatePatterns(repoPath, scanned.allFiles);

  // Detect events and user interactions
  const events: Event[] = await detectEvents(repoPath, scanned.screens);

  // Detect stack from file patterns
  const stackDetected: string[] = [];
  if (scanned.allFiles.some((f) => f.includes("/pages/") || f.includes("/app/"))) {
    stackDetected.push("nextjs");
  }
  if (scanned.allFiles.some((f) => f.includes("package.json"))) {
    stackDetected.push("nodejs");
  }
  if (scanned.allFiles.some((f) => f.endsWith(".tsx") || f.endsWith(".jsx"))) {
    stackDetected.push("react");
  }

  // Build AI metadata
  const aiMetadata: AiMetadata = {
    extractedAt: new Date().toISOString(),
    stackDetected,
    extractionNotes: [
      `Scanned ${scanned.allFiles.length} files`,
      `Found ${screens.length} screens/pages`,
      `Found ${apiEndpoints.length} API endpoints`,
      `Found ${Object.keys(dataModel || {}).length} data model entities`,
      `Found ${navigation.length} navigation items`,
      `Found ${statePatterns.length} state management patterns`,
      `Found ${events.length} event handlers`,
    ].join("; "),
  };

  // Build state from detected patterns
  const state = statePatterns.length > 0
    ? {
        global: {
          stateManagement: statePatterns.map((p) => ({
            type: p.type,
            stores: p.stores,
          })),
        },
      }
    : undefined;

  // Return complete PrdJson structure
  return {
    project: {
      id: generateId(),
      name: projectName,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    screens,
    navigation,
    api: apiEndpoints,
    dataModel,
    state,
    events,
    aiMetadata,
    // Initialize other sections as empty/undefined - will be filled by Tier 2
    brandFoundations: undefined,
    targetAudience: undefined,
    problemDefinition: undefined,
    solutionOverview: undefined,
    leanCanvas: undefined,
  };
}
