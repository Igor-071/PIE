import { promises as fs } from "fs";
import path from "path";
import {
  Tier1Data,
  Screen,
  ApiEndpoint,
  DataModel,
  AiMetadata,
  ConfidenceLevel,
} from "../models/schema.js";
import { scanRepository } from "./repoScanner.js";

/**
 * Extracts Tier 1 technical data from a repository
 * @param repoPath - Path to the unzipped repository directory
 * @returns Promise resolving to Tier1Data
 */
export async function extractTier1(repoPath: string): Promise<Tier1Data> {
  // Scan the repository for files
  const scanned = await scanRepository(repoPath);

  // Extract project name from directory name
  const projectName = path.basename(repoPath).replace(/^repo-/, "");

  // Build screens from discovered page/screen files
  const screens: Screen[] = scanned.screens.map((filePath) => {
    const name = path.basename(filePath, path.extname(filePath));
    // Detect framework from file path or extension
    let framework: string | undefined;
    if (filePath.includes("/app/") || filePath.includes("/pages/api/")) {
      framework = "nextjs";
    } else if (filePath.includes("/src/pages/")) {
      framework = "react";
    } else if (filePath.includes("/screens/")) {
      framework = "react-native";
    }

    return {
      name,
      path: filePath,
      framework,
    };
  });

  // Build API endpoints from discovered API files
  const apiEndpoints: ApiEndpoint[] = scanned.apiFiles.map((filePath) => {
    const segments = filePath.split("/");
    const fileName = path.basename(filePath, path.extname(filePath));

    // Try to infer method and path from file structure
    let method = "GET";
    let endpointPath = "/api";

    if (filePath.includes("/api/")) {
      const apiIndex = segments.indexOf("api");
      if (apiIndex >= 0 && apiIndex < segments.length - 1) {
        endpointPath = "/" + segments.slice(apiIndex + 1, -1).join("/");
      }
    }

    // Check for method in filename (e.g., route.get.ts, api.post.js)
    const methodMatch = fileName.match(/\.(get|post|put|delete|patch)\./i);
    if (methodMatch) {
      method = methodMatch[1].toUpperCase();
    }

    let framework: string | undefined;
    if (filePath.includes("/pages/api/") || filePath.includes("/app/api/")) {
      framework = "nextjs";
    } else if (filePath.includes("/routes/")) {
      framework = "express";
    }

    return {
      method,
      path: endpointPath,
      handler: filePath,
      framework,
    };
  });

  // Build data models from discovered schema/model files
  const dataModels: DataModel[] = scanned.dataModelFiles.map((filePath) => {
    const fileName = path.basename(filePath);
    let type = "unknown";

    if (fileName === "schema.prisma") {
      type = "prisma";
    } else if (filePath.includes("/models/")) {
      type = "mongoose";
    } else if (filePath.includes("/schema/")) {
      type = "typeorm";
    }

    return {
      name: path.basename(filePath, path.extname(filePath)),
      type,
      location: filePath,
    };
  });

  // Detect stack from file patterns
  const stackDetected: string[] = [];
  if (scanned.allFiles.some((f) => f.includes("/pages/") || f.includes("/app/"))) {
    stackDetected.push("nextjs");
  }
  if (scanned.allFiles.some((f) => f.includes("package.json"))) {
    stackDetected.push("nodejs");
  }
  if (scanned.allFiles.some((f) => f.endsWith(".tsx") || f.endsWith(".jsx"))) {
    stackDetected.push("react");
  }
  if (scanned.dataModelFiles.some((f) => f.includes("schema.prisma"))) {
    stackDetected.push("prisma");
  }

  // Build AI metadata
  const aiMetadata: AiMetadata = {
    extractedAt: new Date().toISOString(),
    stackDetected,
    missingPieces: [],
    extractionNotes: [
      `Scanned ${scanned.allFiles.length} files`,
      `Found ${screens.length} screens/pages`,
      `Found ${apiEndpoints.length} API endpoints`,
      `Found ${dataModels.length} data model files`,
    ],
    tier1Confidence: scanned.allFiles.length > 0 ? "medium" : "low",
  };

  return {
    projectName,
    screens,
    navigation: [], // Will be populated in later phases
    apiEndpoints,
    dataModels,
    statePatterns: [], // Will be populated in later phases
    events: [], // Will be populated in later phases
    aiMetadata,
  };
}
