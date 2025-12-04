import { promises as fs } from "fs";
import path from "path";
/**
 * Recursively scans a repository directory to discover relevant files
 * @param repoPath - Path to the repository root directory
 * @returns Promise resolving to a structure with arrays of file paths
 */
export async function scanRepository(repoPath) {
    const result = {
        pages: [],
        screens: [],
        apiFiles: [],
        dataModelFiles: [],
        allFiles: [],
    };
    async function traverseDir(dirPath, relativePath = "") {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            // Skip node_modules, .git, and other common ignore directories
            if (entry.name.startsWith(".") ||
                entry.name === "node_modules" ||
                entry.name === "dist" ||
                entry.name === "build" ||
                entry.name === ".next") {
                continue;
            }
            const fullPath = path.join(dirPath, entry.name);
            const relativeFilePath = path.join(relativePath, entry.name);
            if (entry.isDirectory()) {
                await traverseDir(fullPath, relativeFilePath);
            }
            else if (entry.isFile()) {
                result.allFiles.push(relativeFilePath);
                // Detect pages/screens (common patterns)
                // Exclude UI library directories
                const isUiLibraryComponent = relativeFilePath.includes("/components/ui/") ||
                    relativeFilePath.includes("/ui/") ||
                    relativeFilePath.includes("/@/components/ui/") ||
                    relativeFilePath.match(/\/components\/[^/]+\/(button|input|card|dialog|dropdown|select|checkbox|toast|alert|badge|avatar|skeleton|separator|label|form|table|tabs|accordion|collapsible|command|context-menu|hover-card|menubar|navigation-menu|popover|radio-group|scroll-area|sheet|sidebar|slider|switch|toggle|tooltip)\.(tsx|jsx|ts|js)$/i);
                if (entry.name.match(/\.(tsx|jsx|ts|js)$/) &&
                    !isUiLibraryComponent &&
                    (relativeFilePath.includes("/pages/") ||
                        relativeFilePath.includes("/app/") ||
                        relativeFilePath.includes("/screens/") ||
                        entry.name.match(/page\.(tsx|jsx|ts|js)$/i) ||
                        entry.name.match(/screen\.(tsx|jsx|ts|js)$/i) ||
                        // Include top-level components but not generic UI components
                        (relativeFilePath.includes("/components/") &&
                            !entry.name.match(/^(use-|index\.(tsx|jsx|ts|js)$)/i) &&
                            entry.name.match(/^[A-Z]/))) // Component names start with capital letter
                ) {
                    result.pages.push(relativeFilePath);
                    result.screens.push(relativeFilePath);
                }
                // Detect API files
                if (relativeFilePath.includes("/api/") ||
                    relativeFilePath.includes("/routes/") ||
                    entry.name.match(/route\.(ts|js)$/i) ||
                    entry.name.match(/api\.(ts|js)$/i)) {
                    result.apiFiles.push(relativeFilePath);
                }
                // Detect data model files
                if (entry.name === "schema.prisma" ||
                    entry.name.match(/schema\.(ts|js)$/i) ||
                    entry.name.match(/model(s)?\.(ts|js)$/i) ||
                    relativeFilePath.includes("/models/") ||
                    relativeFilePath.includes("/schema/")) {
                    result.dataModelFiles.push(relativeFilePath);
                }
            }
        }
    }
    try {
        await traverseDir(repoPath);
    }
    catch (error) {
        throw new Error(`Failed to scan repository: ${error instanceof Error ? error.message : String(error)}`);
    }
    return result;
}
//# sourceMappingURL=repoScanner.js.map