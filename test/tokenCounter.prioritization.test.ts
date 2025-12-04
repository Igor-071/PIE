import { describe, it, expect, vi } from "vitest";
import { chunkEvidence, estimateTokens } from "../src/core/tokenCounter.js";

describe("Token Counter - Evidence Prioritization", () => {
  describe("chunkEvidence with prioritization", () => {
    it("should prioritize high-priority evidence types", () => {
      const evidence = [
        {
          id: "1",
          title: "Test File",
          type: "test_file",
          content: "x".repeat(1000),
        },
        {
          id: "2",
          title: "Brief",
          type: "uploaded_brief",
          content: "y".repeat(1000),
        },
        {
          id: "3",
          title: "README",
          type: "repo_readme",
          content: "z".repeat(1000),
        },
        {
          id: "4",
          title: "Config",
          type: "config_file",
          content: "a".repeat(1000),
        },
      ];

      // Chunk with a limit that only allows 2 documents
      const chunked = chunkEvidence(evidence, 600);

      // Should prioritize brief and README over test and config
      expect(chunked.length).toBeLessThanOrEqual(2);
      const types = chunked.map((e) => e.type);
      expect(types).toContain("uploaded_brief");
      expect(types).toContain("repo_readme");
    });

    it("should use more aggressive limits for Tier 2 mode", () => {
      const evidence = [
        {
          id: "1",
          title: "Doc 1",
          type: "repo_readme",
          content: "x".repeat(50000),
        },
        {
          id: "2",
          title: "Doc 2",
          type: "repo_docs",
          content: "y".repeat(50000),
        },
        {
          id: "3",
          title: "Doc 3",
          type: "code_summary",
          content: "z".repeat(50000),
        },
      ];

      // Without tier2Mode, should fit more documents
      const chunkedFull = chunkEvidence(evidence, 150000, false);
      
      // With tier2Mode (80k limit), should fit fewer documents
      const chunkedTier2 = chunkEvidence(evidence, 150000, true);

      expect(chunkedTier2.length).toBeLessThanOrEqual(chunkedFull.length);
    });

    it("should truncate documents when approaching limit", () => {
      const evidence = [
        {
          id: "1",
          title: "Large Doc",
          type: "repo_readme",
          content: "x".repeat(10000),
        },
        {
          id: "2",
          title: "Another Doc",
          type: "repo_docs",
          content: "y".repeat(5000),
        },
      ];

      // Set a limit that requires truncation
      const chunked = chunkEvidence(evidence, 2000);

      expect(chunked.length).toBeGreaterThan(0);
      
      // Check if any document was truncated
      const hasTruncated = chunked.some(doc => 
        doc.content.includes("[Content truncated")
      );
      
      if (chunked.length > 1) {
        expect(hasTruncated).toBe(true);
      }
    });

    it("should estimate tokens correctly with new ratio", () => {
      const text = "x".repeat(1000); // 1000 characters
      const tokens = estimateTokens(text);
      
      // With 3.5 chars/token: 1000 / 3.5 = ~286 tokens
      expect(tokens).toBeGreaterThanOrEqual(280);
      expect(tokens).toBeLessThanOrEqual(300);
    });

    it("should maintain evidence order within same priority", () => {
      const evidence = [
        {
          id: "1",
          title: "README 1",
          type: "repo_readme",
          content: "a".repeat(100),
        },
        {
          id: "2",
          title: "README 2",
          type: "repo_readme",
          content: "b".repeat(100),
        },
        {
          id: "3",
          title: "Test 1",
          type: "test_file",
          content: "c".repeat(100),
        },
      ];

      const chunked = chunkEvidence(evidence, 1000);

      // READMEs should come before test files
      const readmeIndices = chunked
        .map((e, i) => (e.type === "repo_readme" ? i : -1))
        .filter((i) => i >= 0);
      const testIndices = chunked
        .map((e, i) => (e.type === "test_file" ? i : -1))
        .filter((i) => i >= 0);

      if (readmeIndices.length > 0 && testIndices.length > 0) {
        expect(Math.max(...readmeIndices)).toBeLessThan(
          Math.min(...testIndices)
        );
      }
    });

    it("should log chunking information", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const evidence = [
        {
          id: "1",
          title: "Doc",
          type: "repo_readme",
          content: "test content",
        },
      ];

      chunkEvidence(evidence, 10000);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[TokenCounter] Chunked")
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe("Priority weights", () => {
    it("should give highest priority to briefs and READMEs", () => {
      const evidence = [
        { id: "1", title: "Test", type: "test_file", content: "x".repeat(100) },
        { id: "2", title: "Brief", type: "uploaded_brief", content: "x".repeat(100) },
        { id: "3", title: "README", type: "repo_readme", content: "x".repeat(100) },
        { id: "4", title: "Config", type: "config_file", content: "x".repeat(100) },
        { id: "5", title: "Docs", type: "repo_docs", content: "x".repeat(100) },
      ];

      // Chunk with limit for only 3 documents
      const chunked = chunkEvidence(evidence, 100);

      const types = chunked.map((e) => e.type);
      
      // Should include brief, README, and docs (top 3 priorities)
      expect(types).toContain("uploaded_brief");
      expect(types).toContain("repo_readme");
    });

    it("should deprioritize technical evidence", () => {
      const evidence = [
        { id: "1", title: "Brief", type: "uploaded_brief", content: "x".repeat(100) },
        { id: "2", title: "Test", type: "test_file", content: "x".repeat(100) },
        { id: "3", title: "Component", type: "component_analysis", content: "x".repeat(100) },
        { id: "4", title: "Patterns", type: "code_patterns", content: "x".repeat(100) },
      ];

      const chunked = chunkEvidence(evidence, 50);

      // Should prioritize brief over technical evidence
      expect(chunked[0].type).toBe("uploaded_brief");
    });
  });
});

