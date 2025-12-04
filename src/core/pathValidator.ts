import path from "path";

/**
 * Validates that a file path stays within a base directory (prevents path traversal attacks)
 * @param filePath - The file path to validate
 * @param baseDir - The base directory that the path must stay within
 * @returns The resolved absolute path if valid, throws error if invalid
 */
export function validatePath(filePath: string, baseDir: string): string {
  // Resolve both paths to absolute paths
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(baseDir, filePath);
  
  // Check if the resolved path starts with the base directory
  // This prevents directory traversal attacks like ../../
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    throw new Error(`Path traversal detected: ${filePath} attempts to access files outside ${baseDir}`);
  }
  
  return resolvedPath;
}

/**
 * Sanitizes a filename by removing path separators and dangerous characters
 * @param filename - The filename to sanitize
 * @returns Sanitized filename safe for use in file operations
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[/\\]/g, "") // Remove path separators
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/[<>:"|?*]/g, "") // Remove Windows reserved characters
    .trim();
}

/**
 * Validates that a ZIP entry path is safe to extract
 * @param entryPath - The path from the ZIP entry
 * @param extractDir - The directory where files will be extracted
 * @returns true if safe, throws error if unsafe
 */
export function validateZipEntryPath(entryPath: string, extractDir: string): void {
  // Normalize the path to handle different separators
  const normalizedPath = entryPath.replace(/\\/g, "/");
  
  // Check for path traversal attempts
  if (normalizedPath.includes("..") || normalizedPath.startsWith("/")) {
    throw new Error(`Unsafe ZIP entry path detected: ${entryPath}`);
  }
  
  // Check for absolute paths
  if (path.isAbsolute(normalizedPath)) {
    throw new Error(`Absolute path in ZIP entry not allowed: ${entryPath}`);
  }
  
  // Validate the resolved path stays within extract directory
  try {
    validatePath(normalizedPath, extractDir);
  } catch (error) {
    throw new Error(`ZIP entry path validation failed: ${entryPath} - ${error instanceof Error ? error.message : String(error)}`);
  }
}

