import { promises as fs } from "fs";
import path from "path";

// Internal type for state pattern detection
export interface StatePattern {
  type: string;
  stores?: string[];
  location?: string;
}

/**
 * Detects state management patterns and libraries in the codebase
 * @param repoPath - Path to the repository root directory
 * @param allFiles - List of all files in the repository
 * @returns Promise resolving to array of state patterns
 */
export async function detectStatePatterns(
  repoPath: string,
  allFiles: string[]
): Promise<StatePattern[]> {
  const patterns: StatePattern[] = [];
  const seenPatterns = new Set<string>();

  // Find potential state management files
  const stateFiles = allFiles.filter(
    (f) =>
      (f.endsWith(".ts") ||
        f.endsWith(".tsx") ||
        f.endsWith(".js") ||
        f.endsWith(".jsx")) &&
      !f.includes("/node_modules/") &&
      !f.includes("/dist/") &&
      !f.includes("/build/") &&
      (f.includes("/store") ||
        f.includes("/state") ||
        f.includes("/context") ||
        f.includes("/redux") ||
        f.includes("/zustand") ||
        f.includes("Context") ||
        f.includes("Store") ||
        f.includes("Provider"))
  );

  for (const file of stateFiles) {
    try {
      const filePath = path.join(repoPath, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Detect Redux
      const reduxPatterns = detectRedux(content, file);
      for (const pattern of reduxPatterns) {
        const key = `${pattern.type}:${pattern.location}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          patterns.push(pattern);
        }
      }

      // Detect Zustand
      const zustandPatterns = detectZustand(content, file);
      for (const pattern of zustandPatterns) {
        const key = `${pattern.type}:${pattern.location}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          patterns.push(pattern);
        }
      }

      // Detect React Context
      const contextPatterns = detectReactContext(content, file);
      for (const pattern of contextPatterns) {
        const key = `${pattern.type}:${pattern.location}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          patterns.push(pattern);
        }
      }

      // Detect React Query / TanStack Query
      const queryPatterns = detectReactQuery(content, file);
      for (const pattern of queryPatterns) {
        const key = `${pattern.type}:${pattern.location}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          patterns.push(pattern);
        }
      }

      // Detect Recoil
      const recoilPatterns = detectRecoil(content, file);
      for (const pattern of recoilPatterns) {
        const key = `${pattern.type}:${pattern.location}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          patterns.push(pattern);
        }
      }

      // Detect MobX
      const mobxPatterns = detectMobX(content, file);
      for (const pattern of mobxPatterns) {
        const key = `${pattern.type}:${pattern.location}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          patterns.push(pattern);
        }
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return patterns;
}

/**
 * Detects Redux patterns
 */
function detectRedux(content: string, filePath: string): StatePattern[] {
  const patterns: StatePattern[] = [];

  // Check for Redux imports
  if (
    !content.includes("@reduxjs/toolkit") &&
    !content.includes("redux") &&
    !content.includes("react-redux")
  ) {
    return patterns;
  }

  // Pattern 1: createSlice
  const slicePattern = /createSlice\s*\(\s*\{\s*name:\s*['"](\w+)['"]/g;
  const stores: string[] = [];
  let match;
  while ((match = slicePattern.exec(content)) !== null) {
    stores.push(match[1]);
  }

  if (stores.length > 0) {
    patterns.push({
      type: "redux",
      stores,
      location: filePath,
    });
  }

  // Pattern 2: configureStore
  if (content.includes("configureStore")) {
    patterns.push({
      type: "redux",
      stores: ["root-store"],
      location: filePath,
    });
  }

  return patterns;
}

/**
 * Detects Zustand patterns
 */
function detectZustand(content: string, filePath: string): StatePattern[] {
  const patterns: StatePattern[] = [];

  // Check for Zustand imports
  if (!content.includes("zustand")) {
    return patterns;
  }

  // Pattern: create(() => ({ ... }))
  // or export const useStore = create(...)
  const zustandPattern = /(?:const|export\s+const)\s+(\w+)\s*=\s*create/g;
  const stores: string[] = [];
  let match;
  while ((match = zustandPattern.exec(content)) !== null) {
    stores.push(match[1]);
  }

  if (stores.length > 0) {
    patterns.push({
      type: "zustand",
      stores,
      location: filePath,
    });
  }

  return patterns;
}

/**
 * Detects React Context patterns
 */
function detectReactContext(content: string, filePath: string): StatePattern[] {
  const patterns: StatePattern[] = [];

  // Pattern 1: createContext
  const contextPattern = /(?:const|export\s+const)\s+(\w+Context)\s*=\s*createContext/g;
  const stores: string[] = [];
  let match;
  while ((match = contextPattern.exec(content)) !== null) {
    stores.push(match[1]);
  }

  // Pattern 2: Context Provider components
  const providerPattern = /(?:function|const)\s+(\w+Provider)\s*[=\(]/g;
  while ((match = providerPattern.exec(content)) !== null) {
    stores.push(match[1]);
  }

  if (stores.length > 0) {
    patterns.push({
      type: "react-context",
      stores,
      location: filePath,
    });
  }

  return patterns;
}

/**
 * Detects React Query / TanStack Query patterns
 */
function detectReactQuery(content: string, filePath: string): StatePattern[] {
  const patterns: StatePattern[] = [];

  // Check for React Query imports
  if (
    !content.includes("@tanstack/react-query") &&
    !content.includes("react-query")
  ) {
    return patterns;
  }

  // Check for QueryClient or QueryClientProvider
  if (
    content.includes("QueryClient") ||
    content.includes("useQuery") ||
    content.includes("useMutation")
  ) {
    patterns.push({
      type: "react-query",
      stores: ["QueryClient"],
      location: filePath,
    });
  }

  return patterns;
}

/**
 * Detects Recoil patterns
 */
function detectRecoil(content: string, filePath: string): StatePattern[] {
  const patterns: StatePattern[] = [];

  // Check for Recoil imports
  if (!content.includes("recoil")) {
    return patterns;
  }

  // Pattern: atom or selector definitions
  const atomPattern = /(?:const|export\s+const)\s+(\w+)\s*=\s*atom\s*\(/g;
  const selectorPattern = /(?:const|export\s+const)\s+(\w+)\s*=\s*selector\s*\(/g;
  const stores: string[] = [];
  
  let match;
  while ((match = atomPattern.exec(content)) !== null) {
    stores.push(match[1]);
  }
  while ((match = selectorPattern.exec(content)) !== null) {
    stores.push(match[1]);
  }

  if (stores.length > 0) {
    patterns.push({
      type: "recoil",
      stores,
      location: filePath,
    });
  }

  return patterns;
}

/**
 * Detects MobX patterns
 */
function detectMobX(content: string, filePath: string): StatePattern[] {
  const patterns: StatePattern[] = [];

  // Check for MobX imports
  if (!content.includes("mobx")) {
    return patterns;
  }

  // Pattern: makeObservable or makeAutoObservable
  if (
    content.includes("makeObservable") ||
    content.includes("makeAutoObservable")
  ) {
    // Try to extract class names
    const classPattern = /class\s+(\w+)/g;
    const stores: string[] = [];
    let match;
    while ((match = classPattern.exec(content)) !== null) {
      stores.push(match[1]);
    }

    patterns.push({
      type: "mobx",
      stores: stores.length > 0 ? stores : ["MobX Store"],
      location: filePath,
    });
  }

  return patterns;
}

