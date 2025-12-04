# Healthcare Contamination Fix

**Date:** December 4, 2025  
**Issue:** PRDs were being contaminated with healthcare-specific terminology regardless of the actual domain being analyzed

## Problem

The `generateScreenPurpose()` function in `src/core/prdGenerator.ts` contained hardcoded healthcare-specific fallback descriptions that would inject medical terminology into ALL PRDs, even for non-healthcare projects like workflow management apps.

### Examples of Contamination

**Before (BAD):**
```typescript
if (nameLower.includes('dashboard')) 
  return 'Main dashboard displaying key metrics, patient overview, and quick actions';
  //                                            ^^^^^^^ HARDCODED HEALTHCARE TERM

if (nameLower.includes('inventory')) 
  return 'Page for managing medical supplies, equipment inventory, and stock levels';
  //                          ^^^^^^^^ ^^^^^^^^ HARDCODED HEALTHCARE TERMS
```

This caused workflow management apps to have PRDs mentioning "patient overview", "medical supplies", etc.

## Solution

Replaced all domain-specific hardcoded fallbacks with generic, domain-agnostic alternatives.

**After (GOOD):**
```typescript
if (nameLower.includes('dashboard')) 
  return 'Main dashboard displaying key metrics and overview';
  //                                            ^^^^^^ GENERIC

if (nameLower.includes('inventory')) 
  return 'Page for managing inventory and stock levels';
  //                          ^^^^^^^^^ GENERIC
```

### Changes Made

**File:** `src/core/prdGenerator.ts` (lines 59-82)

1. ✅ Removed "patient overview" from dashboard description
2. ✅ Removed entire patient-specific section (was checking for "patient" in screen names)
3. ✅ Removed "medical supplies" from inventory description
4. ✅ Added clear comments: "Generic UI patterns - no domain assumptions"
5. ✅ Expanded generic fallbacks for more screen types (list, form, modal, search)

### Verification

```bash
# No healthcare terms remain in prdGenerator.ts
grep -i "patient\|medical\|healthcare\|clinical\|doctor\|hospital" src/core/prdGenerator.ts
# Result: No matches found ✅
```

## How It Works Now

### The Correct Flow

1. **AI Tier 1, 2, 3 Agents** analyze the actual codebase
   - Healthcare app → AI generates healthcare-specific content
   - Workflow app → AI generates workflow-specific content
   - E-commerce app → AI generates e-commerce-specific content

2. **PRD Generator** uses AI-generated content (primary source)

3. **Only when AI doesn't provide something** → Use minimal generic fallback
   - "Application screen" (NOT "Patient dashboard")
   - "Main dashboard displaying key metrics and overview" (NOT "...patient overview...")

4. **Result:** Each PRD is precisely tailored to the actual project

### Prompts Are Correctly Designed

The AI prompts in `src/core/prompts/` **already do domain detection correctly**:

```typescript
// roleDefinition.prompt.ts - GOOD BEHAVIOR
const isHealthcareDomain = 
  screens.some(s => s.name.toLowerCase().includes("patient") || ...);

// Then warns AI:
"IMPORTANT: Do NOT use healthcare-specific roles unless healthcare 
patterns are clearly present in the screens/evidence above."
```

This is **detection**, not contamination - it adapts to whatever domain is found in the actual code.

## Testing Recommendations

1. Generate PRD for a healthcare app → Should contain healthcare terms (from AI analysis)
2. Generate PRD for a workflow app → Should NOT contain healthcare terms
3. Generate PRD for an e-commerce app → Should contain e-commerce terms (from AI analysis)

## Impact

- ✅ Each PRD is now "precise like NASA"
- ✅ No more domain contamination from hardcoded fallbacks
- ✅ AI-generated content takes precedence
- ✅ Fallbacks are completely generic and minimal
- ✅ System adapts to actual codebase domain

## Files Modified

- `src/core/prdGenerator.ts` - Fixed `generateScreenPurpose()` function

## Files Verified (No Changes Needed)

- `src/core/prompts/*.ts` - Already doing correct domain detection
- Other helper functions in `prdGenerator.ts` - Already generic

---

**Status:** ✅ COMPLETED  
**Build Status:** ✅ PASSING  
**Tests:** Ready for user validation

