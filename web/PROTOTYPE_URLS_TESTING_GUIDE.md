# Prototype URLs Feature - Testing Guide

## Overview
This document describes how to test the new prototype URL feature that allows users to generate PRDs from up to 3 public web URLs, either alone or in combination with a ZIP file.

## Safety Limits Implemented

The following safety limits are in place to prevent abuse and ensure reliable operation:

1. **URL Count Limit**: Maximum 3 URLs per request
2. **Per-URL Timeout**: 10 seconds (configurable)
3. **Max Content Size**: 2 MB per URL (configurable)
4. **Protocol Restriction**: Only HTTP and HTTPS protocols allowed
5. **Graceful Degradation**: Failed URLs don't block processing of other URLs

See `web/lib/urlEvidence.ts` for implementation details.

## Testing Scenarios

### Mode 1: ZIP-only (Existing Behavior)
**Purpose**: Verify existing ZIP-based PRD generation still works unchanged

**Steps**:
1. Navigate to http://127.0.0.1:3000
2. Upload a valid ZIP file
3. Leave all URL fields empty
4. Click "Generate PRD"
5. **Expected**: PRD generation proceeds normally using repository analysis

**Validation**:
- ✅ No errors during upload
- ✅ Progress shows repository unzipping and Tier 1/2/3 processing
- ✅ PRD is generated successfully
- ✅ No URL-related steps appear in progress

---

### Mode 2: URLs-only (New Feature)
**Purpose**: Verify PRD generation from URLs without a ZIP file

**Test URLs** (publicly accessible examples):
- https://example.com
- https://www.wikipedia.org
- https://github.com/features

**Steps**:
1. Navigate to http://127.0.0.1:3000
2. Leave ZIP file field empty
3. Enter 1-3 valid URLs in the prototype URL fields
4. Click "Generate PRD"
5. **Expected**: PRD generation proceeds using only URL-based evidence

**Validation**:
- ✅ Submit button is enabled with URLs but no ZIP
- ✅ No ZIP unzipping step appears
- ✅ Progress shows "Fetching prototype URLs" step
- ✅ Progress shows evidence collection from URLs
- ✅ Tier 2/3 agents run using URL-based evidence
- ✅ PRD is generated with project name derived from first URL
- ✅ PRD content references information from the fetched URLs

---

### Mode 3: ZIP + URLs (Hybrid Mode)
**Purpose**: Verify URLs can augment existing ZIP-based analysis

**Steps**:
1. Navigate to http://127.0.0.1:3000
2. Upload a valid ZIP file
3. Enter 1-3 valid URLs in the prototype URL fields
4. Click "Generate PRD"
5. **Expected**: PRD generation uses both repository and URL evidence

**Validation**:
- ✅ Both ZIP unzipping and URL fetching steps appear
- ✅ Evidence count reflects both repository and URL sources
- ✅ PRD incorporates insights from both sources
- ✅ Token usage accounts for both repository and URL evidence

---

### Edge Cases and Error Handling

#### Test Case: Invalid URLs
**Steps**:
1. Enter invalid URLs (e.g., "not a url", "ftp://bad.com", "javascript:alert(1)")
2. Attempt to submit

**Expected**:
- ✅ Inline validation errors appear for invalid URLs
- ✅ Submit button shows validation error alert
- ✅ No request sent to backend

#### Test Case: Empty Submission
**Steps**:
1. Leave ZIP field empty
2. Leave all URL fields empty
3. Attempt to submit

**Expected**:
- ✅ Submit button is disabled
- ✅ Alert: "Please upload a ZIP file or provide at least one prototype URL"

#### Test Case: URL Timeout
**Steps**:
1. Enter a URL that takes >10s to respond (or use a mock)
2. Submit with URLs-only mode

**Expected**:
- ✅ Request times out after 10 seconds
- ✅ Job continues with remaining URLs (graceful degradation)
- ✅ Step shows successful evidence collection from accessible URLs

#### Test Case: Large Content Size
**Steps**:
1. Enter a URL serving >2MB of HTML content
2. Submit with URLs-only mode

**Expected**:
- ✅ Content size limit enforced
- ✅ URL is skipped with warning in logs
- ✅ Job continues with remaining URLs

#### Test Case: Non-HTML Content
**Steps**:
1. Enter URLs pointing to PDFs, images, or other non-HTML content
2. Submit with URLs-only mode

**Expected**:
- ✅ Non-HTML URLs are skipped with warning
- ✅ Job continues with HTML URLs only

#### Test Case: HTTP Error Responses
**Steps**:
1. Enter URLs that return 404, 500, or other HTTP errors
2. Submit with URLs-only mode

**Expected**:
- ✅ Error URLs are logged and skipped
- ✅ Job continues with successful URLs
- ✅ If all URLs fail, error is shown to user

---

## Backend Validation Checklist

### API Endpoint (`/api/generate`)
- ✅ Accepts `prototypeUrls[]` from FormData
- ✅ Validates up to 3 URLs maximum
- ✅ Accepts requests with ZIP-only, URLs-only, or both
- ✅ Rejects requests with neither ZIP nor URLs

### URL Evidence Collection (`lib/urlEvidence.ts`)
- ✅ `validateUrl()` enforces HTTP/HTTPS only
- ✅ `validateUrls()` limits to max 3 URLs
- ✅ `fetchUrlEvidence()` implements 10s timeout
- ✅ `fetchUrlEvidence()` enforces 2MB content size limit
- ✅ `collectUrlEvidence()` handles errors gracefully per-URL
- ✅ HTML parsing extracts: title, meta description, headings, nav items, buttons, content

### Job Processing (`api/generate/route.ts`)
- ✅ Handles both `hasZip` and `hasUrls` modes
- ✅ Skips ZIP unzipping when ZIP not provided
- ✅ Builds minimal Tier1 from URLs when ZIP not provided
- ✅ Merges repository + URL evidence when both provided
- ✅ Passes combined evidence to Tier 2/3 agents

---

## Frontend Validation Checklist

### UI Components (`app/page.tsx`)
- ✅ Added 3 URL input fields with labels
- ✅ Client-side URL validation with inline error messages
- ✅ Submit button enabled when ZIP OR URLs provided
- ✅ Updated page description to mention "or prototype links"
- ✅ ZIP field label updated to show it's optional if URLs provided
- ✅ Form reset clears URL fields and errors

### User Experience
- ✅ Clear guidance on which fields are required/optional
- ✅ Real-time validation feedback
- ✅ Helpful placeholder text for URL inputs
- ✅ Error messages are user-friendly and actionable

---

## Performance Considerations

### Sequential URL Fetching
URLs are fetched **sequentially** (one at a time) rather than in parallel to:
- Avoid overwhelming target servers
- Be a good internet citizen
- Provide clearer progress tracking

**Trade-off**: Slightly slower for multiple URLs, but more reliable and respectful.

### Token Usage
- URL evidence is included in Tier 2/3 token counts
- Expected increase: ~500-2000 tokens per URL depending on content
- Total token usage is tracked and displayed to user

---

## Monitoring and Logs

Key log messages to watch for:

```
[generate] Valid URLs after validation: N
[processJob] Mode: ZIP=true/false, URLs=true/false (N)
[urlEvidence] Collecting evidence from N URL(s)
[urlEvidence] Fetching URL: https://...
[urlEvidence] Successfully extracted evidence from ... (X chars)
[processJob] Total evidence documents: N
```

Error scenarios:
```
[urlEvidence] Timeout fetching https://...
[urlEvidence] HTTP 404 for https://...
[urlEvidence] Non-HTML content type for https://...
[urlEvidence] Content too large for https://...
```

---

## Manual Testing Commands

### Run the dev server:
```bash
cd web
npm run dev
```

### Test URL validation (Node.js REPL):
```javascript
// From web directory
const { validateUrl, validateUrls } = require('./lib/urlEvidence.ts');

// Test valid URL
validateUrl('https://example.com');

// Test invalid URL
validateUrl('not a url');

// Test multiple URLs
validateUrls(['https://one.com', 'invalid', 'https://two.com'], 3);
```

---

## Known Limitations

1. **Public URLs Only**: No authentication support for protected URLs
2. **Static Content Only**: JavaScript-rendered content not captured
3. **Single Page Per URL**: Does not follow links or crawl sites
4. **Rate Limiting**: No built-in rate limiting per domain (relies on sequential fetching)

---

## Future Enhancements (Not Implemented)

- Support for design tool links (Figma, Framer, etc.)
- Authentication for protected prototypes
- JavaScript rendering with headless browser
- Link crawling (follow navigation to discover pages)
- Rate limiting per domain
- Caching of fetched URL content

---

## Success Criteria

The feature is considered successful if:

1. ✅ All three modes (ZIP-only, URLs-only, ZIP+URLs) work correctly
2. ✅ Invalid inputs are caught and handled gracefully
3. ✅ Safety limits prevent abuse and resource exhaustion
4. ✅ Error handling is robust (failed URLs don't crash jobs)
5. ✅ User experience is clear and intuitive
6. ✅ Existing ZIP-only functionality is unchanged
7. ✅ PRD quality is maintained or improved with URL evidence
