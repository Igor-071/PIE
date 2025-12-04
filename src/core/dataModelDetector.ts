import { promises as fs } from "fs";
import path from "path";
import { DataModel, DataModelEntity, DataModelField } from "../models/schema.js";

/**
 * Enhanced data model detection that finds interfaces, types, and schemas
 * @param repoPath - Path to the repository root directory
 * @param allFiles - List of all files in the repository
 * @returns Promise resolving to data model object
 */
export async function detectDataModels(
  repoPath: string,
  allFiles: string[]
): Promise<DataModel> {
  const dataModel: DataModel = {};

  // Find potential model files
  const modelFiles = allFiles.filter(
    (f) =>
      (f.endsWith(".ts") || f.endsWith(".d.ts")) &&
      !f.includes("/node_modules/") &&
      !f.includes("/dist/") &&
      !f.includes("/build/") &&
      (f.includes("/models/") ||
        f.includes("/types/") ||
        f.includes("/schema/") ||
        f.includes("/interfaces/") ||
        f.match(/schema\.(ts|js)$/i) ||
        f.match(/model(s)?\.(ts|js)$/i) ||
        f.match(/types\.(ts|d\.ts)$/i) ||
        f === "schema.prisma")
  );

  for (const file of modelFiles) {
    try {
      const filePath = path.join(repoPath, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Detect Prisma schema
      if (file.endsWith(".prisma")) {
        const prismaModels = extractPrismaModels(content);
        Object.assign(dataModel, prismaModels);
        continue;
      }

      // Extract TypeScript interfaces
      const interfaces = extractTypeScriptInterfaces(content);
      Object.assign(dataModel, interfaces);

      // Extract TypeScript types
      const types = extractTypeScriptTypes(content);
      Object.assign(dataModel, types);

      // Extract Zod schemas
      const zodSchemas = extractZodSchemas(content);
      Object.assign(dataModel, zodSchemas);
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return dataModel;
}

/**
 * Extracts Prisma model definitions
 */
function extractPrismaModels(content: string): DataModel {
  const models: DataModel = {};

  // Pattern: model User { ... }
  const modelPattern = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  while ((match = modelPattern.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];

    // Extract fields
    const fields: Record<string, DataModelField> = {};
    const fieldPattern = /(\w+)\s+(\w+)/g;
    let fieldMatch;
    while ((fieldMatch = fieldPattern.exec(body)) !== null) {
      fields[fieldMatch[1]] = {
        type: fieldMatch[2],
        required: !body.includes(`${fieldMatch[1]}?`),
      };
    }

    models[name] = {
      fields,
    };
  }

  return models;
}

/**
 * Extracts TypeScript interface definitions
 */
function extractTypeScriptInterfaces(content: string): DataModel {
  const models: DataModel = {};

  // Pattern: export interface User { ... }
  const interfacePattern =
    /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*\{([^}]+)\}/g;
  let match;
  while ((match = interfacePattern.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];

    // Skip utility/generic interfaces
    if (
      name.startsWith("I") ||
      name.includes("Props") ||
      name.includes("State") ||
      name.includes("Context")
    ) {
      continue;
    }

    // Extract fields
    const fields: Record<string, DataModelField> = {};
    const lines = body.split("\n");
    for (const line of lines) {
      const fieldMatch = line.match(/^\s*(\w+)([?]?)\s*:\s*([^;,]+)/);
      if (fieldMatch) {
        fields[fieldMatch[1]] = {
          type: fieldMatch[3].trim(),
          required: !fieldMatch[2], // If no "?", it's required
        };
      }
    }

    if (Object.keys(fields).length > 0) {
      models[name] = { fields };
    }
  }

  return models;
}

/**
 * Extracts TypeScript type definitions
 */
function extractTypeScriptTypes(content: string): DataModel {
  const models: DataModel = {};

  // Pattern: export type User = { ... }
  const typePattern = /(?:export\s+)?type\s+(\w+)\s*=\s*\{([^}]+)\}/g;
  let match;
  while ((match = typePattern.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];

    // Skip utility types
    if (name.startsWith("T") || name.includes("Props") || name.includes("State")) {
      continue;
    }

    // Extract fields
    const fields: Record<string, DataModelField> = {};
    const lines = body.split("\n");
    for (const line of lines) {
      const fieldMatch = line.match(/^\s*(\w+)([?]?)\s*:\s*([^;,]+)/);
      if (fieldMatch) {
        fields[fieldMatch[1]] = {
          type: fieldMatch[3].trim(),
          required: !fieldMatch[2],
        };
      }
    }

    if (Object.keys(fields).length > 0) {
      models[name] = { fields };
    }
  }

  return models;
}

/**
 * Extracts Zod schema definitions
 */
function extractZodSchemas(content: string): DataModel {
  const models: DataModel = {};

  // Pattern: export const userSchema = z.object({ ... })
  const zodPattern =
    /(?:export\s+)?const\s+(\w+(?:Schema)?)\s*=\s*z\.object\s*\(\s*\{([^}]+)\}/g;
  let match;
  while ((match = zodPattern.exec(content)) !== null) {
    let name = match[1];
    const body = match[2];

    // Convert schema name to model name (e.g., userSchema -> User)
    if (name.endsWith("Schema")) {
      name = name.slice(0, -6);
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);

    // Extract fields
    const fields: Record<string, DataModelField> = {};
    const lines = body.split("\n");
    for (const line of lines) {
      const fieldMatch = line.match(/^\s*(\w+)\s*:\s*z\.(\w+)/);
      if (fieldMatch) {
        fields[fieldMatch[1]] = {
          type: `z.${fieldMatch[2]}`,
          required: !line.includes(".optional()"),
        };
      }
    }

    if (Object.keys(fields).length > 0) {
      models[name] = { fields };
    }
  }

  return models;
}
