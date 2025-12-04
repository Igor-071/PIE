/**
 * Validates that a file path stays within a base directory (prevents path traversal attacks)
 * @param filePath - The file path to validate
 * @param baseDir - The base directory that the path must stay within
 * @returns The resolved absolute path if valid, throws error if invalid
 */
export declare function validatePath(filePath: string, baseDir: string): string;
/**
 * Sanitizes a filename by removing path separators and dangerous characters
 * @param filename - The filename to sanitize
 * @returns Sanitized filename safe for use in file operations
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Validates that a ZIP entry path is safe to extract
 * @param entryPath - The path from the ZIP entry
 * @param extractDir - The directory where files will be extracted
 * @returns true if safe, throws error if unsafe
 */
export declare function validateZipEntryPath(entryPath: string, extractDir: string): void;
//# sourceMappingURL=pathValidator.d.ts.map