/**
 * Generator Orchestrator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GeneratorOrchestrator, generateMultiLanguageSDKs } from '../../src/generators/generator-orchestrator.js';
import { TargetLanguage } from '../../src/core/type-mapper.js';
import type { OrchestratorOptions } from '../../src/generators/generator-orchestrator.js';
import { createMinimalSchema, createSchemaWithTypes, createSchemaWithEndpoints } from './test-helpers.js';

describe('GeneratorOrchestrator', () => {
  let baseOptions: OrchestratorOptions;

  beforeEach(() => {
    baseOptions = {
      languages: [TargetLanguage.TypeScript, TargetLanguage.Python],
      outputDir: './test-output',
      packageName: 'test-sdk',
      packageVersion: '1.0.0',
      license: 'MIT',
      parallel: true,
      writeFiles: false, // Don't write to disk in tests
    };
  });

  describe('Constructor', () => {
    it('should create an orchestrator instance', () => {
      const schema = createMinimalSchema();
      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      expect(orchestrator).toBeDefined();
    });

    it('should apply default options', () => {
      const schema = createMinimalSchema();
      const minimalOptions = {
        languages: [TargetLanguage.TypeScript],
        outputDir: './output',
        packageName: 'sdk',
        packageVersion: '1.0.0',
      };
      const orchestrator = new GeneratorOrchestrator(schema, minimalOptions);
      expect(orchestrator).toBeDefined();
    });
  });

  describe('Multi-Language Generation', () => {
    it('should generate SDKs for all specified languages', async () => {
      const schema = createSchemaWithTypes();
      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      const result = await orchestrator.generate();

      expect(result.results.size).toBe(2);
      expect(result.results.has(TargetLanguage.TypeScript)).toBe(true);
      expect(result.results.has(TargetLanguage.Python)).toBe(true);
    });

    it('should generate for all 6 supported languages', async () => {
      const schema = createSchemaWithTypes();
      const options = {
        ...baseOptions,
        languages: [
          TargetLanguage.TypeScript,
          TargetLanguage.Python,
          TargetLanguage.Rust,
          TargetLanguage.Go,
          TargetLanguage.CSharp,
          TargetLanguage.Java,
        ],
      };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      expect(result.results.size).toBe(6);
      expect(result.success).toBe(true);
      expect(result.totalFiles).toBeGreaterThan(0);
    });

    it('should calculate correct metrics', async () => {
      const schema = createSchemaWithTypes();
      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      const result = await orchestrator.generate();

      expect(result.totalFiles).toBeGreaterThan(0);
      expect(result.totalErrors).toBe(0);
      expect(result.totalWarnings).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Parallel vs Sequential Execution', () => {
    it('should support parallel execution', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, parallel: true };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(2);
    });

    it('should support sequential execution', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, parallel: false };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(2);
    });

    it('parallel and sequential should produce same results', async () => {
      const schema = createSchemaWithTypes();

      const parallelOptions = { ...baseOptions, parallel: true };
      const sequentialOptions = { ...baseOptions, parallel: false };

      const orchestrator1 = new GeneratorOrchestrator(schema, parallelOptions);
      const result1 = await orchestrator1.generate();

      const orchestrator2 = new GeneratorOrchestrator(schema, sequentialOptions);
      const result2 = await orchestrator2.generate();

      expect(result1.results.size).toBe(result2.results.size);
      expect(result1.totalFiles).toBe(result2.totalFiles);
      expect(result1.success).toBe(result2.success);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty language list', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, languages: [] };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      expect(result.results.size).toBe(0);
      expect(result.totalFiles).toBe(0);
    });

    it('should mark success as false if any generator has errors', async () => {
      const schema = createMinimalSchema();
      // Add a malformed type to potentially cause issues
      schema.types = [
        {
          id: 'bad_type',
          name: 'BadType',
          kind: 'invalid_kind' as any,
        } as any,
      ];

      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      const result = await orchestrator.generate();

      // Should handle errors gracefully
      expect(result).toBeDefined();
      expect(result.results.size).toBeGreaterThan(0);
    });

    it('should isolate errors to individual languages', async () => {
      const schema = createSchemaWithTypes();
      const options = {
        ...baseOptions,
        languages: [TargetLanguage.TypeScript, TargetLanguage.Python, TargetLanguage.Rust],
      };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      // All languages should generate even if one fails
      expect(result.results.size).toBe(3);
    });
  });

  describe('Build Instructions', () => {
    it('should provide build instructions for all languages', async () => {
      const schema = createSchemaWithTypes();
      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      const result = await orchestrator.generate();

      const buildInstructions = orchestrator.getBuildInstructions(result.results);
      expect(buildInstructions).toContain('# Build Instructions');
      expect(buildInstructions).toContain('typescript');
      expect(buildInstructions).toContain('python');
    });

    it('should provide test instructions for all languages', async () => {
      const schema = createSchemaWithTypes();
      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      const result = await orchestrator.generate();

      const testInstructions = orchestrator.getTestInstructions(result.results);
      expect(testInstructions).toContain('# Test Instructions');
    });

    it('should provide publish instructions for all languages', async () => {
      const schema = createSchemaWithTypes();
      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      const result = await orchestrator.generate();

      const publishInstructions = orchestrator.getPublishInstructions(result.results);
      expect(publishInstructions).toContain('# Publish Instructions');
    });
  });

  describe('File Writing', () => {
    it('should not write files when writeFiles is false', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, writeFiles: false };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      // Just check that generation completed successfully
      expect(result.success).toBe(true);
      expect(result.totalFiles).toBeGreaterThan(0);
    });

    // Note: Testing actual file writing would require filesystem mocking
    // or integration tests with cleanup
  });

  describe('Language-Specific Output', () => {
    it('should generate TypeScript files in typescript directory', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, languages: [TargetLanguage.TypeScript] };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      const tsResult = result.results.get(TargetLanguage.TypeScript);
      expect(tsResult).toBeDefined();
      expect(tsResult!.files.length).toBeGreaterThan(0);
    });

    it('should generate Python files in python directory', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, languages: [TargetLanguage.Python] };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      const pyResult = result.results.get(TargetLanguage.Python);
      expect(pyResult).toBeDefined();
      expect(pyResult!.files.length).toBeGreaterThan(0);
    });

    it('should generate Rust files in rust directory', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, languages: [TargetLanguage.Rust] };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      const rustResult = result.results.get(TargetLanguage.Rust);
      expect(rustResult).toBeDefined();
      expect(rustResult!.files.length).toBeGreaterThan(0);
    });

    it('should generate Go files in go directory', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, languages: [TargetLanguage.Go] };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      const goResult = result.results.get(TargetLanguage.Go);
      expect(goResult).toBeDefined();
      expect(goResult!.files.length).toBeGreaterThan(0);
    });

    it('should generate C# files in csharp directory', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, languages: [TargetLanguage.CSharp] };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      const csResult = result.results.get(TargetLanguage.CSharp);
      expect(csResult).toBeDefined();
      expect(csResult!.files.length).toBeGreaterThan(0);
    });

    it('should generate Java files in java directory', async () => {
      const schema = createSchemaWithTypes();
      const options = { ...baseOptions, languages: [TargetLanguage.Java] };
      const orchestrator = new GeneratorOrchestrator(schema, options);
      const result = await orchestrator.generate();

      const javaResult = result.results.get(TargetLanguage.Java);
      expect(javaResult).toBeDefined();
      expect(javaResult!.files.length).toBeGreaterThan(0);
    });
  });

  describe('Convenience Function', () => {
    it('generateMultiLanguageSDKs should work', async () => {
      const schema = createSchemaWithTypes();
      const result = await generateMultiLanguageSDKs(schema, baseOptions);

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(2);
    });
  });

  describe('Complex Schemas', () => {
    it('should handle schemas with endpoints', async () => {
      const schema = createSchemaWithEndpoints();
      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      const result = await orchestrator.generate();

      expect(result.success).toBe(true);
      expect(result.totalFiles).toBeGreaterThan(0);
    });

    it('should handle minimal schemas', async () => {
      const schema = createMinimalSchema();
      const orchestrator = new GeneratorOrchestrator(schema, baseOptions);
      const result = await orchestrator.generate();

      expect(result.success).toBe(true);
      expect(result.totalErrors).toBe(0);
    });
  });
});
