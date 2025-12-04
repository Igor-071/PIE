/**
 * Cleans up a temporary directory
 * @param dirPath - Path to the directory to clean up
 * @param ignoreErrors - If true, errors during cleanup are ignored
 */
export declare function cleanupDirectory(dirPath: string, ignoreErrors?: boolean): Promise<void>;
/**
 * Cleans up multiple temporary directories
 * @param dirPaths - Array of directory paths to clean up
 * @param ignoreErrors - If true, errors during cleanup are ignored
 */
export declare function cleanupDirectories(dirPaths: string[], ignoreErrors?: boolean): Promise<void>;
/**
 * Cleans up old temporary directories older than specified age
 * @param baseDir - Base directory containing temp directories
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @param pattern - Pattern to match directory names (default: "repo-*")
 */
export declare function cleanupOldDirectories(baseDir: string, maxAgeMs?: number, pattern?: RegExp): Promise<void>;
//# sourceMappingURL=cleanup.d.ts.map