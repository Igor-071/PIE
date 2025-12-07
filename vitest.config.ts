import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    // Prefer .ts files over .js files when both exist
    extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'],
  },
  test: {
    include: ['test/**/*.test.ts'],
    exclude: [
      'test/**/*.js', 
      'node_modules', 
      'dist', 
      'web',
      'src/**/*.js', // Exclude compiled JS files in src
      // Exclude empty test files
      'test/prdGenerator.test.ts',
      'test/tier1Extractor.test.ts',
      'test/tier2Agent.test.ts',
      // Temporarily exclude problematic tests (compiled .js files in src/ cause issues)
      'test/tier2Agent.graceful-degradation.test.ts',
      'test/integration/pipeline.test.ts',
    ],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'web/',
        'test/',
        '**/*.test.ts',
        '**/*.config.ts',
        'src/**/*.js', // Exclude compiled JS files
      ],
    },
    globals: true,
  },
});
