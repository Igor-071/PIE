/**
 * Core module imports for the web application
 * This file provides a bridge to the parent project's compiled modules
 * 
 * Note: The core modules are copied from ../dist to ./pie-core during build
 * Run `npm run build` in the parent directory to update them
 */

// Import core modules directly from the local copy
import { unzipRepository } from "./pie-core/core/unzipRepo.js";
import { extractTier1 } from "./pie-core/core/tier1Extractor.js";
import { collectEvidence } from "./pie-core/core/evidenceCollector.js";
import { buildInitialPrdJsonFromTier1 } from "./pie-core/core/jsonMerger.js";
import { runTier2Agent } from "./pie-core/core/tier2Agent.js";
import { writePrdArtifacts } from "./pie-core/core/prdGenerator.js";

/**
 * Load all core modules needed for PRD generation
 * @returns Object containing all core module functions
 */
export async function loadCoreModules() {
  // Core modules are now imported statically, so just return them
  return {
    unzipRepository,
    extractTier1,
    collectEvidence,
    buildInitialPrdJsonFromTier1,
    runTier2Agent,
    writePrdArtifacts,
  };
}

export type CoreModules = Awaited<ReturnType<typeof loadCoreModules>>;

