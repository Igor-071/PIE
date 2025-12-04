import crypto from "crypto";
/**
 * Generates a unique ID
 */
export function generateId() {
    return crypto.randomBytes(8).toString("hex");
}
/**
 * Generates a deterministic ID from a string
 */
export function generateIdFromString(input) {
    return crypto.createHash("md5").update(input).digest("hex").substring(0, 16);
}
/**
 * Infers screen purpose from name and path
 */
export function inferScreenPurpose(name, path) {
    const lowerName = name.toLowerCase();
    const lowerPath = path.toLowerCase();
    if (lowerName.includes("login") || lowerPath.includes("login")) {
        return "User authentication";
    }
    if (lowerName.includes("dashboard") || lowerPath.includes("dashboard")) {
        return "Dashboard overview";
    }
    if (lowerName.includes("patient") && (lowerName.includes("detail") || lowerName.includes("profile"))) {
        return "Patient details management";
    }
    if (lowerName.includes("patient") && lowerName.includes("list")) {
        return "Patient list view";
    }
    if (lowerName.includes("schedule") || lowerName.includes("calendar")) {
        return "Scheduling and appointments";
    }
    if (lowerName.includes("inventory") || lowerName.includes("stock")) {
        return "Inventory management";
    }
    if (lowerName.includes("report")) {
        return "Reporting and analytics";
    }
    if (lowerName.includes("setting")) {
        return "Application settings";
    }
    return `${name} screen`;
}
//# sourceMappingURL=utils.js.map