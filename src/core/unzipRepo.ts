import AdmZip from "adm-zip";
import { promises as fs } from "fs";
import path from "path";
import { validateZipEntryPath } from "./pathValidator.js";

/**
 * Unzips a repository ZIP file to a temporary directory
 * @param zipPath - Path to the ZIP file
 * @returns Promise resolving to the absolute path of the unzipped directory
 */
export async function unzipRepository(zipPath: string): Promise<string> {
  // Validate input file exists
  try {
    await fs.access(zipPath);
  } catch (error) {
    throw new Error(`ZIP file not found: ${zipPath}`);
  }

  // Validate it's a ZIP file (basic check)
  if (!zipPath.toLowerCase().endsWith(".zip")) {
    throw new Error(`File is not a ZIP archive: ${zipPath}`);
  }

  // Use system temp directory or fallback to process.cwd()/tmp
  const baseTmpDir = process.env.PIE_TMP_DIR || path.join(process.cwd(), "tmp");
  const timestamp = Date.now();
  const tmpDir = path.resolve(baseTmpDir, `repo-${timestamp}`);
  
  // Ensure the base tmp directory exists
  try {
    await fs.mkdir(baseTmpDir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create base temporary directory: ${baseTmpDir}`);
  }

  // Create the specific repo directory
  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create temporary directory: ${tmpDir}`);
  }

  // Validate and extract ZIP entries
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    
    // Validate all entries before extraction
    for (const entry of entries) {
      if (!entry.isDirectory) {
        validateZipEntryPath(entry.entryName, tmpDir);
      }
    }
    
    // Extract after validation
    zip.extractAllTo(tmpDir, true);
  } catch (error) {
    // Clean up on error
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : String(error)}`);
  }

  // GitHub zips often extract to a single subdirectory (e.g., "repo-name-main")
  // Detect and return the actual project root if that's the case
  try {
    const extractedContents = await fs.readdir(tmpDir, { withFileTypes: true });
    
    // If there's exactly one directory and no files, it's likely a GitHub-style zip
    const directories = extractedContents.filter((entry) => entry.isDirectory());
    const files = extractedContents.filter((entry) => entry.isFile());
    
    if (directories.length === 1 && files.length === 0) {
      const singleSubdir = path.join(tmpDir, directories[0].name);
      return singleSubdir;
    }
  } catch (error) {
    // If detection fails, just return the tmp dir
  }

  return tmpDir;
}
