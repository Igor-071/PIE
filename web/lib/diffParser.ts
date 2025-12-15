/**
 * Utility functions for parsing unified diff format and extracting sections
 */

export interface DiffHunk {
  beforeStart: number;
  beforeCount: number;
  afterStart: number;
  afterCount: number;
  beforeLines: string[];
  afterLines: string[];
  contextLines: string[];
}

export interface ParsedDiff {
  hunks: DiffHunk[];
  changedSection?: string; // Extracted section/heading name if found
}

/**
 * Parses a unified diff format string into structured hunks
 */
export function parseUnifiedDiff(patch: string): ParsedDiff {
  const trimmedPatch = patch.trim();
  const lines = trimmedPatch.split("\n");
  
  const hunks: DiffHunk[] = [];
  let changedSection: string | undefined;
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Match hunk headers: @@ -oldStart,oldCount +newStart,newCount @@
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
    
    if (hunkMatch) {
      const beforeStart = parseInt(hunkMatch[1]) - 1; // Convert to 0-based
      const beforeCount = parseInt(hunkMatch[2] || "1");
      const afterStart = parseInt(hunkMatch[3]) - 1;
      const afterCount = parseInt(hunkMatch[4] || "1");
      const context = hunkMatch[5]?.trim() || "";
      
      // Try to extract section name from context (often contains heading info)
      if (context && !changedSection) {
        const headingMatch = context.match(/(?:^|\s)(#{1,4}\s+.+?)(?:\s|$)/);
        if (headingMatch) {
          changedSection = headingMatch[1].replace(/^#+\s+/, "");
        }
      }
      
      const hunk: DiffHunk = {
        beforeStart,
        beforeCount,
        afterStart,
        afterCount,
        beforeLines: [],
        afterLines: [],
        contextLines: [],
      };
      
      i++; // Move past the hunk header
      
      // Read hunk content until next hunk header or end
      while (i < lines.length && !lines[i].startsWith("@@")) {
        const hunkLine = lines[i];
        
        if (hunkLine.startsWith("-")) {
          hunk.beforeLines.push(hunkLine.substring(1));
        } else if (hunkLine.startsWith("+")) {
          hunk.afterLines.push(hunkLine.substring(1));
        } else if (hunkLine.startsWith(" ") || hunkLine === "") {
          const contextLine = hunkLine.startsWith(" ") ? hunkLine.substring(1) : hunkLine;
          hunk.contextLines.push(contextLine);
          
          // Try to extract section from context lines (look for headings)
          if (!changedSection && contextLine.trim().startsWith("#")) {
            changedSection = contextLine.trim().replace(/^#+\s+/, "");
          }
        }
        i++;
      }
      
      hunks.push(hunk);
    } else {
      i++;
    }
  }
  
  // If we still don't have a section, try to find it from the first hunk's context
  if (!changedSection && hunks.length > 0) {
    const firstHunk = hunks[0];
    // Look backwards in context lines for a heading
    for (let j = firstHunk.contextLines.length - 1; j >= 0; j--) {
      const line = firstHunk.contextLines[j].trim();
      if (line.startsWith("#")) {
        changedSection = line.replace(/^#+\s+/, "");
        break;
      }
    }
    
    // Also check beforeLines and afterLines
    if (!changedSection) {
      for (const line of [...firstHunk.beforeLines, ...firstHunk.afterLines]) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#")) {
          changedSection = trimmed.replace(/^#+\s+/, "");
          break;
        }
      }
    }
  }
  
  return { hunks, changedSection };
}

/**
 * Extracts a readable "before" and "after" representation from a diff
 */
export function extractBeforeAfter(patch: string): { before: string; after: string; section?: string } {
  const parsed = parseUnifiedDiff(patch);
  
  // Combine all hunks - show only the actual changed content
  const beforeLines: string[] = [];
  const afterLines: string[] = [];
  
  for (const hunk of parsed.hunks) {
    // Only include actual removals in "before"
    if (hunk.beforeLines.length > 0) {
      beforeLines.push(...hunk.beforeLines);
    }
    
    // Only include actual additions in "after"
    if (hunk.afterLines.length > 0) {
      afterLines.push(...hunk.afterLines);
    }
    
    // Add separator between hunks if multiple
    if (parsed.hunks.length > 1 && hunk !== parsed.hunks[parsed.hunks.length - 1]) {
      if (beforeLines.length > 0) beforeLines.push("...");
      if (afterLines.length > 0) afterLines.push("...");
    }
  }
  
  return {
    before: beforeLines.join("\n"),
    after: afterLines.join("\n"),
    section: parsed.changedSection,
  };
}

/**
 * Finds the approximate line number where changes start in the original document
 */
export function getChangeLocation(patch: string): number | null {
  const parsed = parseUnifiedDiff(patch);
  if (parsed.hunks.length === 0) return null;
  
  // Return the first hunk's starting line (1-based for user display)
  return parsed.hunks[0].beforeStart + 1;
}

