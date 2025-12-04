import { Event } from "../models/schema.js";
/**
 * Detects event handlers and user interactions in the codebase
 * @param repoPath - Path to the repository root directory
 * @param screens - List of screen/component files
 * @returns Promise resolving to array of events
 */
export declare function detectEvents(repoPath: string, screens: string[]): Promise<Event[]>;
//# sourceMappingURL=eventDetector.d.ts.map