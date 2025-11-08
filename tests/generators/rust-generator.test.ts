/**
 * Rust Generator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RustGenerator } from '../../src/generators/rust-generator.js';
import { TargetLanguage } from '../../src/core/type-mapper.js';
import type { GenerationOptions } from '../../src/generators/base-generator.js';
import {
  createMinimalSchema,
  createSchemaWithTypes,
  createSchemaWithEndpoints,
} from './test-helpers.js';

describe('RustGenerator', () => {
  let options: GenerationOptions;

  beforeEach(() => {
    options = {
      outputDir: './output',
      packageName: 'test-sdk',
      packageVersion: '0.1.0',
      license: 'MIT',
      includeExamples: true,
      includeTests: true,
    };
  });

  describe('Constructor', () => {
    it('should create a RustGenerator instance', () => {
      const schema = createMinimalSchema();
      const generator = new RustGenerator(schema, options);
      expect(generator).toBeDefined();
    });

    it('should have correct language', () => {
      const schema = createMinimalSchema();
      const generator = new RustGenerator(schema, options);
      expect(generator.getLanguage()).toBe(TargetLanguage.Rust);
    });
  });

  describe('Package Name Formatting', () => {
    it('should convert package name to snake_case', () => {
      const schema = createMinimalSchema();
      const generator = new RustGenerator(schema, options);
      expect(generator.getFormattedPackageName()).toBe('test_sdk');
    });

    it('should handle PascalCase', () => {
      const schema = createMinimalSchema();
      const customOptions = { ...options, packageName: 'TestSDK' };
      const generator = new RustGenerator(schema, customOptions);
      expect(generator.getFormattedPackageName()).toBe('test_sdk');
    });

    it('should handle kebab-case', () => {
      const schema = createMinimalSchema();
      const customOptions = { ...options, packageName: 'test-sdk' };
      const generator = new RustGenerator(schema, customOptions);
      expect(generator.getFormattedPackageName()).toBe('test_sdk');
    });
  });

  describe('Type Generation', () => {
    it('should generate enum types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/models.rs');
      expect(typesFile).toBeDefined();
      expect(typesFile!.content).toContain('pub enum Role');
      expect(typesFile!.content).toContain('#[serde(rename = "admin")]');
      expect(typesFile!.content).toContain('Admin');
    });

    it('should generate struct types with serde attributes', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/models.rs');
      expect(typesFile).toBeDefined();
      expect(typesFile!.content).toContain('pub struct User');
      expect(typesFile!.content).toContain('#[derive(Debug, Clone, Serialize, Deserialize)]');
      expect(typesFile!.content).toContain('#[serde(rename_all = "snake_case")]');
    });

    it('should handle optional fields with Option<T>', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/models.rs');
      expect(typesFile).toBeDefined();
      expect(typesFile!.content).toContain('pub email: Option<String>');
      expect(typesFile!.content).toContain('pub age: Option<i64>');
    });

    it('should add doc comments from descriptions', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/models.rs');
      expect(typesFile).toBeDefined();
      expect(typesFile!.content).toContain('/// User object');
      expect(typesFile!.content).toContain('/// User ID');
    });
  });

  describe('Client Generation', () => {
    it('should generate client with reqwest', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path === 'src/client.rs');
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('pub struct Client');
      expect(clientFile!.content).toContain('reqwest');
    });

    it('should generate client methods for endpoints', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path === 'src/client.rs');
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('pub async fn create_user');
      expect(clientFile!.content).toContain('pub async fn get_user');
      expect(clientFile!.content).toContain('pub async fn list_users');
    });

    it('should use snake_case for method names', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path === 'src/client.rs');
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('create_user');
      expect(clientFile!.content).not.toContain('createUser');
    });
  });

  describe('Manifest Generation', () => {
    it('should generate Cargo.toml', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const cargoFile = result.files.find((f) => f.path === 'Cargo.toml');
      expect(cargoFile).toBeDefined();
      expect(cargoFile!.content).toContain('[package]');
      expect(cargoFile!.content).toContain('name = "test_sdk"');
      expect(cargoFile!.content).toContain('version = "0.1.0"');
    });

    it('should include required dependencies', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const cargoFile = result.files.find((f) => f.path === 'Cargo.toml');
      expect(cargoFile).toBeDefined();
      expect(cargoFile!.content).toContain('serde');
      expect(cargoFile!.content).toContain('reqwest');
      expect(cargoFile!.content).toContain('tokio');
    });

    it('should respect license option', async () => {
      const schema = createSchemaWithTypes();
      const customOptions = { ...options, license: 'Apache-2.0' };
      const generator = new RustGenerator(schema, customOptions);
      const result = await generator.generate();

      const cargoFile = result.files.find((f) => f.path === 'Cargo.toml');
      expect(cargoFile).toBeDefined();
      expect(cargoFile!.content).toContain('license = "Apache-2.0"');
    });
  });

  describe('README Generation', () => {
    it('should generate README.md', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile).toBeDefined();
      expect(readmeFile!.content).toContain('# Test Provider Rust SDK');
    });

    it('should include installation instructions', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile).toBeDefined();
      expect(readmeFile!.content).toContain('Cargo.toml');
    });

    it('should include usage example', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile).toBeDefined();
      expect(readmeFile!.content).toContain('```rust');
    });
  });

  describe('Examples Generation', () => {
    it('should generate examples when includeExamples is true', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const exampleFile = result.files.find((f) => f.path === 'examples/basic.rs');
      expect(exampleFile).toBeDefined();
    });

    it('should not generate examples when includeExamples is false', async () => {
      const schema = createSchemaWithTypes();
      const customOptions = { ...options, includeExamples: false };
      const generator = new RustGenerator(schema, customOptions);
      const result = await generator.generate();

      const exampleFile = result.files.find((f) => f.path === 'examples/basic.rs');
      expect(exampleFile).toBeUndefined();
    });

    it('should include async/await in examples', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const exampleFile = result.files.find((f) => f.path === 'examples/basic.rs');
      expect(exampleFile).toBeDefined();
      expect(exampleFile!.content).toContain('#[tokio::main]');
      expect(exampleFile!.content).toContain('async');
    });
  });

  describe('Tests Generation', () => {
    it('should generate tests when includeTests is true', async () => {
      const schema = createSchemaWithTypes();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const testFile = result.files.find((f) => f.path === 'src/tests.rs');
      expect(testFile).toBeDefined();
    });

    it('should not generate tests when includeTests is false', async () => {
      const schema = createSchemaWithTypes();
      const customOptions = { ...options, includeTests: false };
      const generator = new RustGenerator(schema, customOptions);
      const result = await generator.generate();

      const testFile = result.files.find((f) => f.path === 'src/tests.rs');
      expect(testFile).toBeUndefined();
    });
  });

  describe('Build Commands', () => {
    it('should provide build command', () => {
      const schema = createMinimalSchema();
      const generator = new RustGenerator(schema, options);
      expect(generator.getBuildCommand()).toBe('cargo build --release');
    });

    it('should provide test command', () => {
      const schema = createMinimalSchema();
      const generator = new RustGenerator(schema, options);
      expect(generator.getTestCommand()).toBe('cargo test');
    });

    it('should provide publish command', () => {
      const schema = createMinimalSchema();
      const generator = new RustGenerator(schema, options);
      expect(generator.getPublishCommand()).toBe('cargo publish');
    });

    it('should provide registry URL', () => {
      const schema = createMinimalSchema();
      const generator = new RustGenerator(schema, options);
      expect(generator.getRegistryUrl()).toBe('https://crates.io');
    });
  });

  describe('Error Handling', () => {
    it('should not fail with empty schema', async () => {
      const schema = createMinimalSchema();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      expect(result.errors).toHaveLength(0);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle missing descriptions gracefully', async () => {
      const schema = createMinimalSchema();
      schema.types = [
        {
          id: 'test_type',
          name: 'TestType',
          kind: 'object' as any,
          properties: [],
          required: [],
        },
      ];

      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Complete Generation', () => {
    it('should generate all expected files', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      const expectedFiles = [
        'src/lib.rs',
        'src/models.rs',
        'src/client.rs',
        'src/error.rs',
        'Cargo.toml',
        'README.md',
        'examples/basic.rs',
        'src/tests.rs',
      ];

      for (const expectedFile of expectedFiles) {
        const file = result.files.find((f) => f.path === expectedFile);
        expect(file).toBeDefined();
      }
    });

    it('should have no errors for valid schema', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toBeDefined();
    });

    it('should provide build, test, and publish commands', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new RustGenerator(schema, options);
      const result = await generator.generate();

      expect(result.buildCommand).toBeDefined();
      expect(result.testCommand).toBeDefined();
      expect(result.publishCommand).toBeDefined();
      expect(result.registryUrl).toBeDefined();
    });
  });
});
