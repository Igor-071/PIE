/**
 * URL Evidence Collector
 * Fetches and analyzes public web URLs to generate evidence documents
 * compatible with the existing Tier 2/Tier 3 pipeline
 */

import * as cheerio from 'cheerio';
import { createRequire } from "module";

export interface UrlEvidenceOptions {
  timeout?: number; // Timeout in milliseconds (default: 10000)
  maxContentSize?: number; // Max content size in bytes (default: 2MB)
  maxPages?: number; // For JS-rendered crawling (default: 10 total pages)
  renderJavascript?: boolean; // Attempt headless rendering for JS-heavy prototypes (default: true)
  maxRequestsToRecord?: number; // Max XHR/fetch requests to record per page (default: 60)
}

export interface EvidenceDocument {
  content: string;
  metadata: {
    source: string;
    type: string;
    path?: string;
    url?: string;
  };
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_MAX_CONTENT_SIZE = 2 * 1024 * 1024; // 2MB
const DEFAULT_MAX_PAGES = 10;
const DEFAULT_MAX_REQUESTS = 60;

/**
 * Fetch and analyze a single URL to extract evidence
 */
async function fetchUrlEvidence(
  url: string,
  options: UrlEvidenceOptions = {}
): Promise<EvidenceDocument | null> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const maxContentSize = options.maxContentSize || DEFAULT_MAX_CONTENT_SIZE;

  try {
    console.log(`[urlEvidence] Fetching URL: ${url}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PIE-Bot/1.0; +Product Intelligence Engine)',
        },
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[urlEvidence] Timeout fetching ${url}`);
        return null;
      }
      throw fetchError;
    }

    if (!response.ok) {
      console.error(`[urlEvidence] HTTP ${response.status} for ${url}`);
      return null;
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      console.warn(`[urlEvidence] Non-HTML content type for ${url}: ${contentType}`);
      return null;
    }

    // Check content size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxContentSize) {
      console.warn(`[urlEvidence] Content too large for ${url}: ${contentLength} bytes`);
      return null;
    }

    const html = await response.text();

    // Double-check actual size
    if (html.length > maxContentSize) {
      console.warn(`[urlEvidence] Content too large for ${url}: ${html.length} bytes`);
      return null;
    }

    // Parse HTML and extract useful content
    const $ = cheerio.load(html);

    // Remove script, style, and other non-content elements
    $('script, style, noscript, iframe, svg').remove();

    // Extract key elements
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    // Extract headings
    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !headings.includes(text)) {
        headings.push(text);
      }
    });

    // Extract navigation items
    const navItems: string[] = [];
    $('nav a, header a').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100 && !navItems.includes(text)) {
        navItems.push(text);
      }
    });

    // Extract button labels
    const buttons: string[] = [];
    $('button, a.btn, [role="button"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100 && !buttons.includes(text)) {
        buttons.push(text);
      }
    });

    // Extract main content (paragraphs, list items)
    const contentPieces: string[] = [];
    $('main p, article p, .content p, section p, li').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20 && text.length < 500) {
        contentPieces.push(text);
      }
    });

    // Build evidence content
    const evidenceContent = buildEvidenceContent({
      url,
      title,
      metaDescription,
      headings,
      navItems,
      buttons,
      contentPieces: contentPieces.slice(0, 20), // Limit to first 20 paragraphs
    });

    console.log(`[urlEvidence] Successfully extracted evidence from ${url} (${evidenceContent.length} chars)`);

    return {
      content: evidenceContent,
      metadata: {
        source: 'prototype-url',
        type: 'url-evidence',
        url,
        path: new URL(url).pathname,
      },
    };
  } catch (error) {
    console.error(`[urlEvidence] Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Build a structured evidence document from extracted elements
 */
function buildEvidenceContent(data: {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  navItems: string[];
  buttons: string[];
  contentPieces: string[];
  formFields?: Array<{ label?: string; name?: string; placeholder?: string; type?: string }>;
  networkCalls?: Array<{ method: string; url: string; status?: number }>;
}): string {
  const parts: string[] = [];

  parts.push(`# Evidence from Prototype: ${data.url}\n`);

  if (data.title) {
    parts.push(`## Page Title\n${data.title}\n`);
  }

  if (data.metaDescription) {
    parts.push(`## Description\n${data.metaDescription}\n`);
  }

  if (data.headings.length > 0) {
    parts.push(`## Key Sections (Headings)\n${data.headings.map(h => `- ${h}`).join('\n')}\n`);
  }

  if (data.navItems.length > 0) {
    parts.push(`## Navigation Items\n${data.navItems.map(n => `- ${n}`).join('\n')}\n`);
  }

  if (data.buttons.length > 0) {
    parts.push(`## Interactive Elements (Buttons/CTAs)\n${data.buttons.map(b => `- ${b}`).join('\n')}\n`);
  }

  if (data.contentPieces.length > 0) {
    parts.push(`## Content Samples\n${data.contentPieces.map(c => `- ${c}`).join('\n\n')}\n`);
  }

  if (data.formFields && data.formFields.length > 0) {
    parts.push(
      `## Form Fields (Detected)\n${data.formFields
        .slice(0, 30)
        .map((f) => `- ${[f.label, f.name, f.placeholder, f.type].filter(Boolean).join(" | ")}`)
        .join("\n")}\n`
    );
  }

  if (data.networkCalls && data.networkCalls.length > 0) {
    parts.push(
      `## Network Calls (XHR/fetch)\n${data.networkCalls
        .slice(0, 60)
        .map((c) => `- ${c.method} ${c.url}${typeof c.status === "number" ? ` (HTTP ${c.status})` : ""}`)
        .join("\n")}\n`
    );
  }

  return parts.join('\n');
}

async function tryCollectRenderedUrlEvidence(
  urls: string[],
  options: UrlEvidenceOptions
): Promise<EvidenceDocument[] | null> {
  const renderJavascript = options.renderJavascript ?? true;
  if (!renderJavascript) return null;

  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const maxRequestsToRecord = options.maxRequestsToRecord ?? DEFAULT_MAX_REQUESTS;

  const require = createRequire(import.meta.url);
  let playwright: any;
  try {
    playwright = require("playwright");
  } catch {
    console.warn("[urlEvidence] Playwright not installed; falling back to HTML-only extraction");
    return null;
  }

  const visited = new Set<string>();
  const queue: string[] = [];

  for (const u of urls) {
    const normalized = validateUrl(u);
    if (normalized) queue.push(normalized);
  }

  if (!queue.length) return [];

  const evidenceDocs: EvidenceDocument[] = [];
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (compatible; PIE-Bot/1.0; +Product Intelligence Engine)",
    });

    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      console.log(`[urlEvidence] Rendering URL: ${url}`);
      const page = await context.newPage();

      const networkCalls: Array<{ method: string; url: string; status?: number }> = [];
      page.on("response", (res: any) => {
        try {
          if (networkCalls.length >= maxRequestsToRecord) return;
          const req = res.request();
          const type = req.resourceType?.() || "";
          if (type !== "xhr" && type !== "fetch") return;
          networkCalls.push({
            method: (req.method?.() || "GET").toUpperCase(),
            url: res.url(),
            status: res.status?.(),
          });
        } catch {
          // ignore
        }
      });

      try {
        await page.goto(url, { timeout, waitUntil: "domcontentloaded" });
        // Give SPA/hydration time to paint meaningful UI
        await page.waitForTimeout(1200);
      } catch (e) {
        console.warn(`[urlEvidence] Render failed for ${url}, skipping: ${String(e)}`);
        await page.close().catch(() => {});
        continue;
      }

      const extracted = await page.evaluate(() => {
        const getText = (el: Element | null) => (el?.textContent || "").trim();

        const title = document.title || "";
        const metaDescription = (document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content || "";

        const headings = Array.from(document.querySelectorAll("h1,h2,h3"))
          .map(getText)
          .filter((t) => t && t.length < 140);

        const navItems = Array.from(document.querySelectorAll("nav a, header a"))
          .map(getText)
          .filter((t) => t && t.length < 100);

        const buttons = Array.from(document.querySelectorAll("button, [role='button'], a.btn, a[role='button']"))
          .map(getText)
          .filter((t) => t && t.length < 100);

        const contentPieces = Array.from(document.querySelectorAll("main p, article p, section p, li"))
          .map(getText)
          .filter((t) => t.length > 20 && t.length < 500)
          .slice(0, 25);

        const formFields = Array.from(document.querySelectorAll("input, textarea, select"))
          .map((el) => {
            const input = el as HTMLInputElement;
            const name = input.name || input.id || "";
            const placeholder = (input as any).placeholder || "";
            const type = (input as any).type || el.tagName.toLowerCase();
            // Try to find a label
            let label = "";
            if (input.id) {
              const lbl = document.querySelector(`label[for='${CSS.escape(input.id)}']`);
              label = getText(lbl);
            }
            if (!label) {
              const parentLabel = el.closest("label");
              label = getText(parentLabel);
            }
            return { label, name, placeholder, type };
          })
          .filter((f) => f.label || f.name || f.placeholder)
          .slice(0, 40);

        const links = Array.from(document.querySelectorAll("a[href]"))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter(Boolean);

        return {
          title,
          metaDescription,
          headings: Array.from(new Set(headings)),
          navItems: Array.from(new Set(navItems)),
          buttons: Array.from(new Set(buttons)),
          contentPieces,
          formFields,
          links: Array.from(new Set(links)),
        };
      });

      // Crawl: add a few same-origin links
      try {
        const base = new URL(url);
        for (const href of extracted.links as string[]) {
          if (queue.length + visited.size >= maxPages) break;
          try {
            const u = new URL(href);
            if (u.origin !== base.origin) continue;
            // Ignore obvious non-pages
            if (u.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip)$/i)) continue;
            const normalized = u.toString();
            if (!visited.has(normalized) && !queue.includes(normalized)) {
              queue.push(normalized);
            }
          } catch {
            continue;
          }
        }
      } catch {
        // ignore crawl if URL parsing fails
      }

      const evidenceContent = buildEvidenceContent({
        url,
        title: extracted.title,
        metaDescription: extracted.metaDescription,
        headings: extracted.headings,
        navItems: extracted.navItems,
        buttons: extracted.buttons,
        contentPieces: extracted.contentPieces,
        formFields: extracted.formFields,
        networkCalls,
      });

      evidenceDocs.push({
        content: evidenceContent,
        metadata: {
          source: "prototype-url",
          type: "url-evidence-rendered",
          url,
          path: (() => {
            try {
              return new URL(url).pathname;
            } catch {
              return undefined;
            }
          })(),
        },
      });

      await page.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
  }

  return evidenceDocs;
}

/**
 * Collect evidence from multiple URLs
 * Returns an array of evidence documents, skipping any URLs that fail
 */
export async function collectUrlEvidence(
  urls: string[],
  options: UrlEvidenceOptions = {}
): Promise<EvidenceDocument[]> {
  console.log(`[urlEvidence] Collecting evidence from ${urls.length} URL(s)`);

  // Prefer rendered extraction for JS-heavy prototypes (Lovable/v0), with fallback to HTML-only.
  try {
    const rendered = await tryCollectRenderedUrlEvidence(urls, options);
    if (rendered && rendered.length > 0) {
      console.log(`[urlEvidence] Successfully collected ${rendered.length} rendered evidence document(s)`);
      return rendered;
    }
  } catch (e) {
    console.warn(`[urlEvidence] Rendered evidence collection failed; falling back to HTML-only: ${String(e)}`);
  }

  const evidenceDocs: EvidenceDocument[] = [];

  // Fetch URLs sequentially to avoid overwhelming servers
  for (const url of urls) {
    try {
      const doc = await fetchUrlEvidence(url, options);
      if (doc) {
        evidenceDocs.push(doc);
      }
    } catch (error) {
      console.error(`[urlEvidence] Failed to fetch ${url}, continuing with remaining URLs:`, error);
      // Continue with other URLs even if one fails
    }
  }

  console.log(`[urlEvidence] Successfully collected ${evidenceDocs.length} evidence document(s) from URLs`);
  return evidenceDocs;
}

/**
 * Validate and normalize a URL
 */
export function validateUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) {
      return null;
    }

    // Must start with http:// or https://
    if (!trimmed.match(/^https?:\/\//i)) {
      return null;
    }

    // Try to parse it
    const parsed = new URL(trimmed);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate and filter an array of URLs
 * Returns up to maxCount valid URLs
 */
export function validateUrls(urls: string[], maxCount: number = 3): string[] {
  const validUrls: string[] = [];
  
  for (const url of urls) {
    if (validUrls.length >= maxCount) {
      break;
    }
    
    const normalized = validateUrl(url);
    if (normalized && !validUrls.includes(normalized)) {
      validUrls.push(normalized);
    }
  }
  
  return validUrls;
}
