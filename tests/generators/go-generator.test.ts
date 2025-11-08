import { describe, it, expect } from 'vitest';
import { GoGenerator } from '../../src/generators/go-generator';
import { TargetLanguage } from '../../src/core/type-mapper';
import { createMinimalSchema, createSchemaWithTypes, createSchemaWithEndpoints } from './test-helpers';

describe('GoGenerator', () => {
  const options = {
    outputDir: '/tmp/test-output',
    packageName: 'testsdk',
    packageVersion: '1.0.0',
    language: TargetLanguage.Go,
    includeTests: true,
    includeExamples: true,
    includeDocs: true,
  };

  describe('Basic Functionality', () => {
    it('should create instance', () => {
      const schema = createMinimalSchema();
      const generator = new GoGenerator(schema, options);

      expect(generator).toBeDefined();
      expect(generator.getLanguage()).toBe(TargetLanguage.Go);
    });

    it('should format package name in lowercase', () => {
      const schema = createMinimalSchema();
      const generator = new GoGenerator(schema, options);

      const packageName = generator.getFormattedPackageName();
      expect(packageName).toBe(packageName.toLowerCase());
    });
  });

  describe('Type Generation', () => {
    it('should generate struct types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path.includes('types.go'));
      expect(typesFile).toBeDefined();
      expect(typesFile!.content).toContain('type');
      expect(typesFile!.content).toContain('struct');
    });

    it('should use PascalCase for exported types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path.includes('types.go'));
      expect(typesFile!.content).toMatch(/type [A-Z]\w+ struct/);
    });

    it('should include JSON tags', async () => {
      const schema = createSchemaWithTypes();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path.includes('types.go'));
      expect(typesFile!.content).toContain('`json:"');
    });

    it('should handle pointer types for optional fields', async () => {
      const schema = createSchemaWithTypes();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path.includes('types.go'));
      expect(typesFile!.content).toMatch(/\*\w+/); // Should have pointer types
    });
  });

  describe('Client Generation', () => {
    it('should generate client struct', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('client.go'));
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('type');
      expect(clientFile!.content).toContain('Client struct');
    });

    it('should generate NewClient constructor', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('client.go'));
      expect(clientFile!.content).toContain('func NewClient');
    });

    it('should use http.Client', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('client.go'));
      expect(clientFile!.content).toMatch(/http\.Client|net\/http/);
    });
  });

  describe('Manifest Generation', () => {
    it('should generate go.mod', async () => {
      const schema = createSchemaWithTypes();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const goModFile = result.files.find((f) => f.path === 'go.mod');
      expect(goModFile).toBeDefined();
      expect(goModFile!.content).toContain('module');
      expect(goModFile!.content).toContain('go ');
    });

    it('should specify Go version', async () => {
      const schema = createSchemaWithTypes();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const goModFile = result.files.find((f) => f.path === 'go.mod');
      expect(goModFile!.content).toMatch(/go 1\.\d+/);
    });
  });

  describe('Build Commands', () => {
    it('should provide build command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      expect(result.buildCommand).toBeDefined();
      expect(result.buildCommand).toContain('go build');
    });

    it('should provide test command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      expect(result.testCommand).toBeDefined();
      expect(result.testCommand).toContain('go test');
    });
  });

  describe('Integration', () => {
    it('should generate complete module structure', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new GoGenerator(schema, options);
      const result = await generator.generate();

      const hasGoMod = result.files.some((f) => f.path === 'go.mod');
      const hasTypes = result.files.some((f) => f.path.includes('types.go'));
      const hasClient = result.files.some((f) => f.path.includes('client.go'));
      const hasReadme = result.files.some((f) => f.path === 'README.md');

      expect(hasGoMod).toBe(true);
      expect(hasTypes).toBe(true);
      expect(hasClient).toBe(true);
      expect(hasReadme).toBe(true);
    });
  });
});
