/**
 * Tests for URL Evidence Collection
 */

import { describe, it, expect } from 'vitest';
import { validateUrl, validateUrls } from '../lib/urlEvidence';

describe('URL Validation', () => {
  describe('validateUrl', () => {
    it('should accept valid HTTP URLs', () => {
      const url = 'http://example.com';
      expect(validateUrl(url)).toBe('http://example.com/');
    });

    it('should accept valid HTTPS URLs', () => {
      const url = 'https://example.com/path';
      expect(validateUrl(url)).toBe('https://example.com/path');
    });

    it('should trim whitespace', () => {
      const url = '  https://example.com  ';
      expect(validateUrl(url)).toBe('https://example.com/');
    });

    it('should reject empty strings', () => {
      expect(validateUrl('')).toBeNull();
      expect(validateUrl('   ')).toBeNull();
    });

    it('should reject URLs without protocol', () => {
      expect(validateUrl('example.com')).toBeNull();
      expect(validateUrl('www.example.com')).toBeNull();
    });

    it('should reject non-HTTP protocols', () => {
      expect(validateUrl('ftp://example.com')).toBeNull();
      expect(validateUrl('file:///path/to/file')).toBeNull();
      expect(validateUrl('javascript:alert(1)')).toBeNull();
    });

    it('should reject malformed URLs', () => {
      expect(validateUrl('not a url')).toBeNull();
      expect(validateUrl('http://')).toBeNull();
      expect(validateUrl('https://')).toBeNull();
    });

    it('should handle URLs with query params and fragments', () => {
      const url = 'https://example.com/path?query=1#fragment';
      expect(validateUrl(url)).toBe('https://example.com/path?query=1#fragment');
    });
  });

  describe('validateUrls', () => {
    it('should filter and deduplicate valid URLs', () => {
      const urls = [
        'https://example.com',
        'http://test.com',
        'invalid',
        '',
        'https://example.com', // duplicate
      ];
      const result = validateUrls(urls, 3);
      expect(result).toHaveLength(2);
      expect(result).toContain('https://example.com/');
      expect(result).toContain('http://test.com/');
    });

    it('should respect maxCount limit', () => {
      const urls = [
        'https://one.com',
        'https://two.com',
        'https://three.com',
        'https://four.com',
      ];
      const result = validateUrls(urls, 2);
      expect(result).toHaveLength(2);
      expect(result).toEqual(['https://one.com/', 'https://two.com/']);
    });

    it('should return empty array for all invalid URLs', () => {
      const urls = ['invalid', 'not a url', '', 'ftp://bad.com'];
      const result = validateUrls(urls, 3);
      expect(result).toHaveLength(0);
    });

    it('should handle empty input', () => {
      const result = validateUrls([], 3);
      expect(result).toHaveLength(0);
    });

    it('should default to max 3 URLs', () => {
      const urls = [
        'https://one.com',
        'https://two.com',
        'https://three.com',
        'https://four.com',
        'https://five.com',
      ];
      const result = validateUrls(urls); // no maxCount specified
      expect(result).toHaveLength(3);
    });
  });
});
