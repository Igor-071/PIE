#!/usr/bin/env node
/**
 * Test script to verify core modules can be loaded
 * Run this from the web directory: node test-modules.js
 */

import { promises as fs } from "fs";
import * as path from "path";
import { pathToFileURL } from "url";

async function testModuleLoading() {
  try {
    console.log("Testing core module loading...");
    const currentDir = process.cwd();
    console.log(`Current dir: ${currentDir}`);
    
    // Go up from web directory to product-intelligence-engine
    const baseDir = currentDir.endsWith("/web") || currentDir.endsWith("\\web") 
      ? path.resolve(currentDir, "..")
      : currentDir;
    const distPath = path.resolve(baseDir, "dist");
    console.log(`Base dir: ${baseDir}`);
    console.log(`Dist path: ${distPath}`);
    
    // Check if dist exists
    try {
      await fs.access(distPath);
      console.log("✓ Dist directory exists");
    } catch {
      console.error("✗ Dist directory not found!");
      console.error(`  Expected at: ${distPath}`);
      console.error("  Run: cd .. && npm run build");
      process.exit(1);
    }
    
    // Check if core files exist
    const coreFiles = [
      "unzipRepo.js",
      "tier1Extractor.js",
      "evidenceCollector.js",
      "jsonMerger.js",
      "tier2Agent.js",
      "prdGenerator.js",
    ];
    
    for (const file of coreFiles) {
      const filePath = path.join(distPath, "core", file);
      try {
        await fs.access(filePath);
        console.log(`✓ ${file} exists`);
      } catch {
        console.error(`✗ ${file} not found at ${filePath}`);
        process.exit(1);
      }
    }
    
    // Try to import one module
    console.log("\nTesting dynamic import...");
    const testModulePath = pathToFileURL(path.join(distPath, "core", "unzipRepo.js")).href;
    console.log(`Importing: ${testModulePath}`);
    
    const module = await import(testModulePath);
    if (module.unzipRepository) {
      console.log("✓ Successfully imported unzipRepository function");
    } else {
      console.error("✗ Module imported but unzipRepository function not found");
      console.error("  Available exports:", Object.keys(module));
      process.exit(1);
    }
    
    console.log("\n✅ All tests passed! Core modules are ready to use.");
  } catch (error) {
    console.error("\n✗ Error:", error.message);
    if (error.stack) {
      console.error("\nStack:", error.stack);
    }
    process.exit(1);
  }
}

testModuleLoading();

