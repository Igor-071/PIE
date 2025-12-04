import { promises as fs } from "fs";
import path from "path";

export type EvidenceType = "repo_readme" | "repo_docs" | "uploaded_brief";

export interface EvidenceDocument {
  id: string;
  type: EvidenceType;
  title: string;
  content: string;
  path?: string;
}

export interface EvidenceCollectorOptions {
  briefText?: string | null;
}

/**
 * Collects textual evidence from the repository (README, docs, optional brief)
 * @param repoPath - Path to the repository root directory
 * @param options - Options including optional brief text
 * @returns Promise resolving to an array of EvidenceDocument
 */
export async function collectEvidence(
  repoPath: string,
  options: EvidenceCollectorOptions = {}
): Promise<EvidenceDocument[]> {
  const documents: EvidenceDocument[] = [];

  // Collect README files from repo root
  const readmeNames = ["README.md", "README.txt", "readme.md", "readme.txt"];
  for (const readmeName of readmeNames) {
    const readmePath = path.join(repoPath, readmeName);
    try {
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
      // File doesn't exist, continue
      continue;
    }
  }

  // Collect documentation files from /docs directory
  const docsPath = path.join(repoPath, "docs");
  try {
    const entries = await fs.readdir(docsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const fileName = entry.name.toLowerCase();
        // Only process markdown and text files
        if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
          const filePath = path.join(docsPath, entry.name);
          try {
            const content = await fs.readFile(filePath, "utf-8");
            documents.push({
              id: `doc-${entry.name}`,
              type: "repo_docs",
              title: `Documentation: ${entry.name}`,
              content,
              path: filePath,
            });
          } catch {
            // Skip files that can't be read as text
            continue;
          }
        }
      }
    }
  } catch {
    // /docs directory doesn't exist, skip
  }

  // Add uploaded brief if provided
  if (options.briefText && options.briefText.trim().length > 0) {
    documents.push({
      id: "brief",
      type: "uploaded_brief",
      title: "Uploaded brief",
      content: options.briefText.trim(),
    });
  }

  return documents;
}
