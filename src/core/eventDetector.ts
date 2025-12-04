import { promises as fs } from "fs";
import path from "path";
import { Event } from "../models/schema.js";
import { generateId } from "./utils.js";

/**
 * Detects event handlers and user interactions in the codebase
 * @param repoPath - Path to the repository root directory
 * @param screens - List of screen/component files
 * @returns Promise resolving to array of events
 */
export async function detectEvents(
  repoPath: string,
  screens: string[]
): Promise<Event[]> {
  const events: Event[] = [];
  const seenEvents = new Set<string>();

  // Sample a subset of screen files (analyzing all can be slow)
  const filesToAnalyze = screens.slice(0, Math.min(50, screens.length));

  for (const file of filesToAnalyze) {
    try {
      const filePath = path.join(repoPath, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Extract event handlers
      const fileEvents = extractEventHandlers(content, file);
      for (const event of fileEvents) {
        const key = `${event.name}:${event.location}`;
        if (!seenEvents.has(key)) {
          seenEvents.add(key);
          events.push(event);
        }
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return events;
}

/**
 * Extracts event handlers from React component code
 */
function extractEventHandlers(content: string, filePath: string): Event[] {
  const events: Event[] = [];

  // Pattern 1: onClick, onChange, onSubmit, etc.
  const reactEventPattern = /on(Click|Change|Submit|Focus|Blur|KeyPress|KeyDown|KeyUp|MouseEnter|MouseLeave|Load|Error|Select|Input|DoubleClick|ContextMenu|Drag|Drop|Scroll|Resize|Wheel|Touch\w+)(?:=\{([^}]+)\}|=)/gi;
  let match;
  while ((match = reactEventPattern.exec(content)) !== null) {
    const eventType = match[1];
    const handler = match[2] ? match[2].trim() : "inline";

    events.push({
      id: generateId(),
      type: `user-interaction`,
      trigger: `on${eventType}`,
      outputs: [handler.replace(/[()]/g, "")],
      // Legacy support
      name: `on${eventType}`,
      handler: handler.replace(/[()]/g, ""),
      location: filePath,
    });
  }

  // Pattern 2: addEventListener
  const addEventListenerPattern = /addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*([^)]+)\)/gi;
  while ((match = addEventListenerPattern.exec(content)) !== null) {
    events.push({
      id: generateId(),
      type: "dom-event",
      trigger: match[1],
      outputs: [match[2].trim()],
      // Legacy support
      name: match[1],
      handler: match[2].trim(),
      location: filePath,
    });
  }

  // Pattern 3: Custom event emissions (emit, dispatch)
  const emitPattern = /(?:emit|dispatch|trigger)\s*\(\s*['"]([^'"]+)['"]/gi;
  while ((match = emitPattern.exec(content)) !== null) {
    events.push({
      id: generateId(),
      type: "custom-event",
      trigger: match[1],
      outputs: ["emit"],
      // Legacy support
      name: match[1],
      handler: "emit",
      location: filePath,
    });
  }

  // Pattern 4: Form submissions
  const formSubmitPattern = /<form[^>]*onSubmit=\{([^}]+)\}/gi;
  while ((match = formSubmitPattern.exec(content)) !== null) {
    events.push({
      id: generateId(),
      type: "form-submission",
      trigger: "onSubmit",
      outputs: [match[1].trim()],
      // Legacy support
      name: "formSubmit",
      handler: match[1].trim(),
      location: filePath,
    });
  }

  // Pattern 5: Button clicks
  const buttonClickPattern = /<[Bb]utton[^>]*onClick=\{([^}]+)\}/gi;
  while ((match = buttonClickPattern.exec(content)) !== null) {
    events.push({
      id: generateId(),
      type: "button-click",
      trigger: "onClick",
      outputs: [match[1].trim()],
      // Legacy support
      name: "buttonClick",
      handler: match[1].trim(),
      location: filePath,
    });
  }

  // Deduplicate by trigger within file
  const uniqueEvents: Event[] = [];
  const seen = new Set<string>();
  for (const event of events) {
    const key = event.trigger || event.name || event.id;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEvents.push(event);
    }
  }

  return uniqueEvents;
}

