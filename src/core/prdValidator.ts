/**
 * PRD Validation Layer
 * Validates PRD JSON structure, required fields, and data quality
 */

import { PrdJson, Project } from "../models/schema.js";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  score: number; // 0-100 quality score
}

/**
 * Validates the complete PRD JSON structure
 */
export function validatePrd(prd: PrdJson): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const info: ValidationError[] = [];

  // Validate required project fields
  if (!prd.project) {
    errors.push({
      field: "project",
      message: "Project object is required",
      severity: "error",
    });
  } else {
    validateProject(prd.project, errors, warnings, info);
  }

  // Validate required fields
  if (!prd.project?.name || prd.project.name.trim() === "") {
    errors.push({
      field: "project.name",
      message: "Project name is required",
      severity: "error",
    });
  }

  if (!prd.project?.id || prd.project.id.trim() === "") {
    errors.push({
      field: "project.id",
      message: "Project ID is required",
      severity: "error",
    });
  }

  // Validate screens
  if (prd.screens && prd.screens.length > 0) {
    prd.screens.forEach((screen, index) => {
      if (!screen.id || !screen.name) {
        errors.push({
          field: `screens[${index}]`,
          message: "Screen must have both id and name",
          severity: "error",
        });
      }
    });
  } else {
    warnings.push({
      field: "screens",
      message: "No screens found. PRD may be incomplete.",
      severity: "warning",
    });
  }

  // Validate data model
  if (prd.dataModel) {
    if (typeof prd.dataModel === "object") {
      if ("entities" in prd.dataModel) {
        // EnhancedDataModel
        const entities = prd.dataModel.entities || {};
        if (Object.keys(entities).length === 0) {
          warnings.push({
            field: "dataModel.entities",
            message: "Data model has no entities",
            severity: "warning",
          });
        }
      } else {
        // Standard DataModel
        if (Object.keys(prd.dataModel).length === 0) {
          warnings.push({
            field: "dataModel",
            message: "Data model is empty",
            severity: "warning",
          });
        }
      }
    }
  }

  // Validate strategic sections (warnings if missing)
  const strategicSections = [
    { field: "executiveSummary", name: "Executive Summary" },
    { field: "brandFoundations", name: "Brand Foundations" },
    { field: "targetAudience", name: "Target Audience" },
    { field: "problemDefinition", name: "Problem Definition" },
    { field: "solutionOverview", name: "Solution Overview" },
    { field: "leanCanvas", name: "Lean Canvas" },
  ];

  strategicSections.forEach(({ field, name }) => {
    if (!prd[field as keyof PrdJson]) {
      warnings.push({
        field,
        message: `${name} is missing. Consider adding this section for a complete PRD.`,
        severity: "warning",
      });
    }
  });

  // Validate brand foundations quality
  if (prd.brandFoundations) {
    validateBrandFoundations(prd.brandFoundations, warnings, info);
  }

  // Validate target audience quality
  if (prd.targetAudience && prd.targetAudience.length > 0) {
    prd.targetAudience.forEach((audience, index) => {
      validateTargetAudience(audience, index, warnings, info);
    });
  }

  // Validate API endpoints
  if (prd.api && prd.api.length > 0) {
    prd.api.forEach((endpoint, index) => {
      if (!endpoint.name || !endpoint.endpoint || !endpoint.method) {
        warnings.push({
          field: `api[${index}]`,
          message: "API endpoint should have name, endpoint, and method",
          severity: "warning",
        });
      }
    });
  }

  // Calculate quality score
  const score = calculateQualityScore(errors, warnings, info, prd);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
    score,
  };
}

/**
 * Validates project object
 */
function validateProject(
  project: Project,
  errors: ValidationError[],
  warnings: ValidationError[],
  info: ValidationError[]
): void {
  if (!project.name || project.name.trim() === "") {
    errors.push({
      field: "project.name",
      message: "Project name is required",
      severity: "error",
    });
  }

  if (!project.version || project.version.trim() === "") {
    warnings.push({
      field: "project.version",
      message: "Project version is recommended",
      severity: "warning",
    });
  }

  if (!project.createdAt || project.createdAt.trim() === "") {
    warnings.push({
      field: "project.createdAt",
      message: "Created date is recommended",
      severity: "warning",
    });
  }

  if (!project.updatedAt || project.updatedAt.trim() === "") {
    warnings.push({
      field: "project.updatedAt",
      message: "Updated date is recommended",
      severity: "warning",
    });
  }
}

/**
 * Validates brand foundations for quality
 */
function validateBrandFoundations(
  brandFoundations: any,
  warnings: ValidationError[],
  info: ValidationError[]
): void {
  if (brandFoundations.mission) {
    const missionLength = brandFoundations.mission.length;
    if (missionLength < 50) {
      warnings.push({
        field: "brandFoundations.mission",
        message: "Mission statement is too short. Aim for 2-3 sentences with specific details.",
        severity: "warning",
      });
    } else if (missionLength > 500) {
      warnings.push({
        field: "brandFoundations.mission",
        message: "Mission statement is very long. Consider condensing.",
        severity: "info",
      });
    }
  } else {
    warnings.push({
      field: "brandFoundations.mission",
      message: "Mission statement is missing",
      severity: "warning",
    });
  }

  if (brandFoundations.vision) {
    const visionLength = brandFoundations.vision.length;
    if (visionLength < 100) {
      warnings.push({
        field: "brandFoundations.vision",
        message: "Vision statement is too short. Aim for 3-4 sentences describing the future state.",
        severity: "warning",
      });
    }
  } else {
    warnings.push({
      field: "brandFoundations.vision",
      message: "Vision statement is missing",
      severity: "warning",
    });
  }

  if (!brandFoundations.coreValues || brandFoundations.coreValues.length === 0) {
    warnings.push({
      field: "brandFoundations.coreValues",
      message: "Core values are recommended",
      severity: "warning",
    });
  }
}

/**
 * Validates target audience for quality
 */
function validateTargetAudience(
  audience: any,
  index: number,
  warnings: ValidationError[],
  info: ValidationError[]
): void {
  if (!audience.name || audience.name.trim() === "") {
    warnings.push({
      field: `targetAudience[${index}].name`,
      message: "Audience name is recommended",
      severity: "warning",
    });
  }

  if (!audience.goals || audience.goals.length === 0) {
    warnings.push({
      field: `targetAudience[${index}].goals`,
      message: "Audience goals are recommended",
      severity: "warning",
    });
  }

  if (!audience.painPoints || audience.painPoints.length === 0) {
    warnings.push({
      field: `targetAudience[${index}].painPoints`,
      message: "Audience pain points are recommended",
      severity: "warning",
    });
  } else {
    // Check if pain points are detailed (first-person quotes)
    const hasDetailedPainPoints = audience.painPoints.some((pp: string) =>
      pp.includes('"') || pp.toLowerCase().includes("i ") || pp.length > 50
    );
    if (!hasDetailedPainPoints) {
      info.push({
        field: `targetAudience[${index}].painPoints`,
        message: "Consider writing pain points as first-person quotes with specific details",
        severity: "info",
      });
    }
  }
}

/**
 * Calculates a quality score (0-100) based on validation results
 */
function calculateQualityScore(
  errors: ValidationError[],
  warnings: ValidationError[],
  info: ValidationError[],
  prd: PrdJson
): number {
  let score = 100;

  // Deduct points for errors (critical)
  score -= errors.length * 10;

  // Deduct points for warnings (important)
  score -= warnings.length * 2;

  // Deduct points for missing strategic sections
  const strategicSections = [
    "executiveSummary",
    "brandFoundations",
    "targetAudience",
    "problemDefinition",
    "solutionOverview",
    "leanCanvas",
  ];
  const missingStrategic = strategicSections.filter(
    (field) => !prd[field as keyof PrdJson]
  ).length;
  score -= missingStrategic * 3;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Validates a specific field path in the PRD
 */
export function validateField(
  prd: PrdJson,
  fieldPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const parts = fieldPath.split(".");

  let current: any = prd;
  for (const part of parts) {
    if (current === undefined || current === null) {
      errors.push({
        field: fieldPath,
        message: `Field path "${fieldPath}" is not accessible`,
        severity: "error",
      });
      return errors;
    }
    current = current[part];
  }

  if (current === undefined || current === null) {
    errors.push({
      field: fieldPath,
      message: `Field "${fieldPath}" is missing`,
      severity: "error",
    });
  }

  return errors;
}

/**
 * Gets validation summary as a human-readable string
 */
export function getValidationSummary(result: ValidationResult): string {
  const parts: string[] = [];

  if (result.isValid) {
    parts.push("✓ PRD is valid");
  } else {
    parts.push(`✗ PRD has ${result.errors.length} error(s)`);
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning(s)`);
  }

  if (result.info.length > 0) {
    parts.push(`${result.info.length} suggestion(s)`);
  }

  parts.push(`Quality Score: ${result.score}/100`);

  return parts.join(" • ");
}
