/**
 * URL Evidence Collector
 * Fetches and analyzes public web URLs to generate evidence documents
 * compatible with the existing Tier 2/Tier 3 pipeline
 */

import * as cheerio from 'cheerio';

export interface UrlEvidenceOptions {
  timeout?: number; // Timeout in milliseconds (default: 10000)
  maxContentSize?: number; // Max content size in bytes (default: 2MB)
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

  return parts.join('\n');
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
