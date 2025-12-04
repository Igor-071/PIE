import {
  PrdJson,
  DataModel,
} from "../models/schema.js";

/**
 * Builds initial PRD JSON structure from Tier 1 extraction
 * @param tier1 - Tier 1 data with projectName and technical fields
 * @returns Complete PRD JSON with empty Tier 2 fields
 */
export function buildInitialPrdJsonFromTier1(tier1: { projectName: string; screens: any[]; navigation: any[]; apiEndpoints: any[]; dataModels: DataModel; statePatterns: any[]; events: any[]; aiMetadata: any }): PrdJson {
  // Convert tier1 format to PrdJson format
  return {
    project: {
      id: `project-${Date.now()}`,
      name: tier1.projectName,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    screens: tier1.screens,
    navigation: tier1.navigation,
    api: tier1.apiEndpoints,
    dataModel: tier1.dataModels,
    state: tier1.statePatterns.length > 0 ? { global: {} } : undefined,
    events: tier1.events,
    aiMetadata: tier1.aiMetadata,
    metadata: {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      generatorVersion: "0.1.0",
    },
  };
}
