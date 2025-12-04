import AdmZip from "adm-zip";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Create temporary directory with timestamp
  const timestamp = Date.now();
  const tmpDir = path.resolve(__dirname, "../../tmp", `repo-${timestamp}`);
  
  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create temporary directory: ${tmpDir}`);
  }

  // Unzip the file
  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tmpDir, true);
  } catch (error) {
    throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : String(error)}`);
  }

  return tmpDir;
}
