import { promises as fs } from "fs";
import path from "path";
/**
 * Cleans up a temporary directory
 * @param dirPath - Path to the directory to clean up
 * @param ignoreErrors - If true, errors during cleanup are ignored
 */
export async function cleanupDirectory(dirPath, ignoreErrors = true) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    }
    catch (error) {
        if (!ignoreErrors) {
            throw new Error(`Failed to cleanup directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Log error but don't throw if ignoreErrors is true
        console.error(`Warning: Failed to cleanup directory ${dirPath}:`, error);
    }
}
/**
 * Cleans up multiple temporary directories
 * @param dirPaths - Array of directory paths to clean up
 * @param ignoreErrors - If true, errors during cleanup are ignored
 */
export async function cleanupDirectories(dirPaths, ignoreErrors = true) {
    await Promise.allSettled(dirPaths.map((dirPath) => cleanupDirectory(dirPath, ignoreErrors)));
}
/**
 * Cleans up old temporary directories older than specified age
 * @param baseDir - Base directory containing temp directories
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @param pattern - Pattern to match directory names (default: "repo-*")
 */
export async function cleanupOldDirectories(baseDir, maxAgeMs = 24 * 60 * 60 * 1000, pattern = /^repo-\d+$/) {
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        const now = Date.now();
        for (const entry of entries) {
            if (entry.isDirectory() && pattern.test(entry.name)) {
                const dirPath = path.join(baseDir, entry.name);
                try {
                    const stats = await fs.stat(dirPath);
                    const age = now - stats.mtimeMs;
                    if (age > maxAgeMs) {
                        await cleanupDirectory(dirPath, true);
                        console.log(`Cleaned up old directory: ${dirPath}`);
                    }
                }
                catch (error) {
                    // Skip directories that can't be accessed
                    console.error(`Failed to check directory ${dirPath}:`, error);
                }
            }
        }
    }
    catch (error) {
        // Base directory doesn't exist or can't be accessed - that's okay
        if (error.code !== "ENOENT") {
            console.error(`Failed to cleanup old directories in ${baseDir}:`, error);
        }
    }
}
//# sourceMappingURL=cleanup.js.map