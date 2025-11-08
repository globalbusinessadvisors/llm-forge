import { describe, it, expect } from 'vitest';
import { CSharpGenerator } from '../../src/generators/csharp-generator';
import { TargetLanguage } from '../../src/core/type-mapper';
import { createMinimalSchema, createSchemaWithTypes, createSchemaWithEndpoints } from './test-helpers';

describe('CSharpGenerator', () => {
  const options = {
    outputDir: '/tmp/test-output',
    packageName: 'TestSDK',
    packageVersion: '1.0.0',
    language: TargetLanguage.CSharp,
    includeTests: true,
    includeExamples: true,
    includeDocs: true,
  };

  describe('Basic Functionality', () => {
    it('should create instance', () => {
      const schema = createMinimalSchema();
      const generator = new CSharpGenerator(schema, options);

      expect(generator).toBeDefined();
      expect(generator.getLanguage()).toBe(TargetLanguage.CSharp);
    });

    it('should format package name in PascalCase', () => {
      const schema = createMinimalSchema();
      const generator = new CSharpGenerator(schema, options);

      const packageName = generator.getFormattedPackageName();
      expect(packageName).toMatch(/^[A-Z]/); // Should start with uppercase
    });
  });

  describe('Type Generation', () => {
    it('should generate record types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const modelsFile = result.files.find((f) => f.path.includes('Models.cs'));
      expect(modelsFile).toBeDefined();
      expect(modelsFile!.content).toContain('public record');
    });

    it('should use System.Text.Json attributes', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const modelsFile = result.files.find((f) => f.path.includes('Models.cs'));
      expect(modelsFile!.content).toContain('using System.Text.Json');
      expect(modelsFile!.content).toContain('[JsonPropertyName(');
    });

    it('should generate enum types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const modelsFile = result.files.find((f) => f.path.includes('Models.cs'));
      expect(modelsFile!.content).toContain('public enum');
    });

    it('should use nullable reference types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const modelsFile = result.files.find((f) => f.path.includes('Models.cs'));
      expect(modelsFile!.content).toMatch(/\w+\?/); // Should have nullable types
    });
  });

  describe('Client Generation', () => {
    it('should generate client class', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('Client.cs'));
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('public class');
      expect(clientFile!.content).toContain('Client');
    });

    it('should use HttpClient', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('Client.cs'));
      expect(clientFile!.content).toContain('HttpClient');
    });

    it('should generate async methods', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('Client.cs'));
      expect(clientFile!.content).toContain('async');
      expect(clientFile!.content).toContain('Task');
    });
  });

  describe('Manifest Generation', () => {
    it('should generate .csproj file', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const csprojFile = result.files.find((f) => f.path.endsWith('.csproj'));
      expect(csprojFile).toBeDefined();
      expect(csprojFile!.content).toContain('<Project Sdk=');
      expect(csprojFile!.content).toContain('<TargetFramework>');
    });

    it('should target modern .NET', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const csprojFile = result.files.find((f) => f.path.endsWith('.csproj'));
      expect(csprojFile!.content).toMatch(/net\d+\.\d+/);
    });
  });

  describe('Build Commands', () => {
    it('should provide build command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      expect(result.buildCommand).toBeDefined();
      expect(result.buildCommand).toContain('dotnet build');
    });

    it('should provide test command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      expect(result.testCommand).toBeDefined();
      expect(result.testCommand).toContain('dotnet test');
    });

    it('should provide publish command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      expect(result.publishCommand).toBeDefined();
      expect(result.publishCommand).toContain('dotnet pack');
    });
  });

  describe('Integration', () => {
    it('should generate complete project structure', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new CSharpGenerator(schema, options);
      const result = await generator.generate();

      const hasCsproj = result.files.some((f) => f.path.endsWith('.csproj'));
      const hasModels = result.files.some((f) => f.path.includes('Models.cs'));
      const hasClient = result.files.some((f) => f.path.includes('Client.cs'));
      const hasReadme = result.files.some((f) => f.path === 'README.md');

      expect(hasCsproj).toBe(true);
      expect(hasModels).toBe(true);
      expect(hasClient).toBe(true);
      expect(hasReadme).toBe(true);
    });
  });
});
