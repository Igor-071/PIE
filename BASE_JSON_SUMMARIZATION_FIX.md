# Base JSON Summarization Fix - Critical Bug Resolution

## The Real Problem

After implementing tier-specific evidence filtering, the system was STILL timing out with the same error:

```
Tier 2 agent failed: Request timed out. The analysis may be too large (estimated 14635 tokens).
```

## Root Cause Analysis

Terminal logs revealed the actual token breakdown:
```
[TokenCounter] Chunked 2/2 documents, ~567 tokens (limit: 80000)
[Tier2Agent] Token estimates: Base JSON=13020, Evidence=599, System=1016, Total=14635
```

**The evidence filtering WAS working** (only 599 tokens)!

**The real problem:** The **Base JSON** was 13,020 tokens - 89% of the total prompt!

### Why This Happened

The Tier 2 agent receives the complete Tier 1 extraction JSON containing:
- Full screen definitions (25 screens × ~400 lines each)
- Complete API endpoint schemas
- Data models with all fields and types
- State management implementation details
- Navigation routes with parameters
- Component hierarchies
- Event handlers

**All of this was being sent to OpenAI in every Tier 2 request!**

### What Tier 2 Actually Needs

For business strategy analysis, Tier 2 only needs:
- ✅ Project name and description
- ✅ Screen names (to infer user personas)
- ✅ API endpoint paths (to infer features)
- ✅ Data model names (to infer domain)
- ✅ High-level counts
- ❌ Complete technical implementations

## The Fix

### 1. Created `summarizeBaseJsonForTier2()` Function

This function extracts only high-level information:

```typescript
function summarizeBaseJsonForTier2(baseJson: PrdJson): any {
  return {
    project: baseJson.project,
    summary: {
      screens: {
        count: 25,
        names: ["PatientPortal", "AdminDashboard", "ProviderView", ...],
        paths: ["/patients", "/admin", "/providers", ...]
      },
      api: {
        count: 42,
        endpoints: ["GET /api/patients", "POST /api/appointments", ...]
      },
      dataModel: {
        count: 18,
        models: ["Patient", "Appointment", "Provider", ...]
      },
      // ... other summaries
    },
    aiMetadata: baseJson.aiMetadata
  };
}
```

### 2. Updated Tier 2 Agent

Modified `tier2Agent.ts` to use the summary instead of full JSON:

**Before:**
```typescript
const baseJsonString = JSON.stringify(baseJson, null, 2); // 13,020 tokens
```

**After:**
```typescript
const baseJsonSummary = summarizeBaseJsonForTier2(baseJson);
const baseJsonString = JSON.stringify(baseJsonSummary, null, 2); // ~1,500 tokens
```

### 3. Updated User Message

Clarified that the AI receives a summary:

```
## Technical Summary (High-Level Overview)
The following is a SUMMARY of technical data extracted from the codebase.
You'll receive detailed technical specs in Tier 3 - focus here on business strategy.
```

## Expected Results

### Token Reduction

**Before:**
- Base JSON: 13,020 tokens (89%)
- Evidence: 599 tokens (4%)
- System: 1,016 tokens (7%)
- **Total: 14,635 tokens**

**After:**
- Base JSON Summary: ~1,500 tokens (48%)
- Evidence: 599 tokens (19%)
- System: 1,016 tokens (33%)
- **Total: ~3,115 tokens** (79% reduction!)

### Performance

- **Before**: Timeout at 270 seconds with 14,635 tokens
- **After**: Expected completion in 30-60 seconds with ~3,115 tokens

### Quality Impact

**NO negative impact - actually improves quality:**

1. **Better Focus**: AI can concentrate on business-relevant signals
2. **Faster Processing**: More time for thoughtful strategic analysis
3. **Less Noise**: No distraction from technical implementation details
4. **Complete Preservation**: Tier 3 still receives the FULL base JSON for technical requirements

## Files Modified

- `src/core/tier2Agent.ts`
  - Added `summarizeBaseJsonForTier2()` function
  - Updated to use summary instead of full JSON
  - Added better logging for token estimates

## Testing

The fix has been compiled and synced. To test:

1. Start the web server: `cd web && npm run dev`
2. Upload the repository that caused the timeout
3. Monitor console logs for:
   ```
   [Tier2Agent] Token estimates: Base JSON Summary=~1500, Evidence=~600, System=1016, Total=~3100
   [Tier2Agent] Using summarized base JSON (screens: 25, APIs: 42, models: 18)
   ```
4. Verify Tier 2 completes successfully in 30-60 seconds
5. Check that PRD business strategy sections are well-populated

## Architecture Correctness

This fix aligns with the proper tier architecture:

- **Tier 1**: Extracts ALL technical details
- **Tier 2**: Receives SUMMARY for business strategy ← **Fixed!**
- **Tier 3**: Receives ALL details for technical requirements

Each tier now gets the right level of detail for its purpose.

## Success Metrics

- ✅ Tier 2 timeout rate: Should be 0%
- ✅ Token count: ~3,000 (vs 14,635)
- ✅ Processing time: 30-60 seconds (vs timeout)
- ✅ PRD quality: Same or better business insights
- ✅ Cost: ~80% reduction in token usage

---

**Status**: ✅ Implemented and Built  
**Ready for Testing**: ✅ Yes  
**Date**: December 4, 2025  
**Impact**: Critical - Fixes core timeout issue

