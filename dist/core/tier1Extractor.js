import { promises as fs } from "fs";
import path from "path";
import { scanRepository } from "./repoScanner.js";
import { extractNavigation } from "./navigationExtractor.js";
import { detectApiEndpoints } from "./apiDetector.js";
import { detectDataModels } from "./dataModelDetector.js";
import { detectStatePatterns } from "./statePatternDetector.js";
import { detectEvents } from "./eventDetector.js";
/**
 * Extracts project name from package.json, README, or directory name
 * @param repoPath - Path to the repository directory
 * @param allFiles - List of all files in the repository
 * @returns Project name
 */
async function extractProjectName(repoPath, allFiles) {
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
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        }
    }
    catch (error) {
        // package.json not found or invalid, continue to fallback
    }
    // Try 2: Parse README title
    const readmeFiles = allFiles.filter((f) => f.match(/^README\.(md|txt)$/i));
    for (const readmeFile of readmeFiles) {
        try {
            const readmePath = path.join(repoPath, readmeFile);
            const readmeContent = await fs.readFile(readmePath, "utf-8");
            // Look for first # heading
            const match = readmeContent.match(/^#\s+(.+)$/m);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        catch (error) {
            // Continue to next README or fallback
        }
    }
    // Try 3: Clean up directory name
    const dirName = path.basename(repoPath);
    return dirName
        .replace(/^repo-/, "")
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
/**
 * Extracts Tier 1 technical data from a repository
 * @param repoPath - Path to the unzipped repository directory
 * @returns Promise resolving to Tier1Data
 */
export async function extractTier1(repoPath) {
    // Scan the repository for files
    const scanned = await scanRepository(repoPath);
    // Extract project name from package.json, README, or directory
    const projectName = await extractProjectName(repoPath, scanned.allFiles);
    // Build screens from discovered page/screen files
    const screens = scanned.screens.map((filePath, index) => {
        const name = path.basename(filePath, path.extname(filePath));
        // Detect framework from file path or extension
        let framework;
        if (filePath.includes("/app/") || filePath.includes("/pages/api/")) {
            framework = "nextjs";
        }
        else if (filePath.includes("/src/pages/")) {
            framework = "react";
        }
        else if (filePath.includes("/screens/")) {
            framework = "react-native";
        }
        return {
            id: `screen-${index}`,
            name,
            path: filePath,
            framework,
        };
    });
    // Detect API endpoints from both route files and code calls
    const apiEndpoints = await detectApiEndpoints(repoPath, scanned.allFiles);
    // Detect data models from TypeScript interfaces, types, and schemas
    const dataModels = await detectDataModels(repoPath, scanned.allFiles);
    // Detect stack from file patterns
    const stackDetected = [];
    if (scanned.allFiles.some((f) => f.includes("/pages/") || f.includes("/app/"))) {
        stackDetected.push("nextjs");
    }
    if (scanned.allFiles.some((f) => f.includes("package.json"))) {
        stackDetected.push("nodejs");
    }
    if (scanned.allFiles.some((f) => f.endsWith(".tsx") || f.endsWith(".jsx"))) {
        stackDetected.push("react");
    }
    if (scanned.dataModelFiles.some((f) => f.includes("schema.prisma"))) {
        stackDetected.push("prisma");
    }
    // Extract navigation structure
    const navigation = await extractNavigation(repoPath, scanned.screens);
    // Detect state management patterns
    const statePatterns = await detectStatePatterns(repoPath, scanned.allFiles);
    // Detect events and user interactions
    const events = await detectEvents(repoPath, scanned.screens);
    // Build AI metadata
    const aiMetadata = {
        extractedAt: new Date().toISOString(),
        stackDetected,
        missingPieces: [],
        extractionNotes: `Scanned ${scanned.allFiles.length} files; Found ${screens.length} screens/pages; Found ${apiEndpoints.length} API endpoints; Found ${dataModels.length} data model files; Found ${navigation.length} navigation items; Found ${statePatterns.length} state management patterns; Found ${events.length} event handlers`,
    };
    return {
        projectName,
        screens,
        navigation,
        apiEndpoints,
        dataModels: dataModels,
        statePatterns,
        events,
        aiMetadata,
    };
}
//# sourceMappingURL=tier1Extractor.js.map