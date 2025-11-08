import { describe, it, expect } from 'vitest';
import { JavaGenerator } from '../../src/generators/java-generator';
import { TargetLanguage } from '../../src/core/type-mapper';
import { createMinimalSchema, createSchemaWithTypes, createSchemaWithEndpoints } from './test-helpers';

describe('JavaGenerator', () => {
  const options = {
    outputDir: '/tmp/test-output',
    packageName: 'com.example.testsdk',
    packageVersion: '1.0.0',
    language: TargetLanguage.Java,
    includeTests: true,
    includeExamples: true,
    includeDocs: true,
  };

  describe('Basic Functionality', () => {
    it('should create instance', () => {
      const schema = createMinimalSchema();
      const generator = new JavaGenerator(schema, options);

      expect(generator).toBeDefined();
      expect(generator.getLanguage()).toBe(TargetLanguage.Java);
    });

    it('should format package name correctly', () => {
      const schema = createMinimalSchema();
      const generator = new JavaGenerator(schema, options);

      const packageName = generator.getFormattedPackageName();
      expect(packageName).toContain('.');
      expect(packageName).toBe(packageName.toLowerCase());
    });
  });

  describe('Type Generation', () => {
    it('should generate record types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const modelFiles = result.files.filter((f) => f.path.includes('/models/'));
      expect(modelFiles.length).toBeGreaterThan(0);

      const hasRecord = modelFiles.some((f) => f.content.includes('public record'));
      expect(hasRecord).toBe(true);
    });

    it('should use Jackson annotations', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const modelFile = result.files.find((f) => f.path.includes('/models/'));
      expect(modelFile!.content).toContain('import com.fasterxml.jackson');
      // Jackson annotations like @JsonProperty or @JsonValue should be present
      expect(modelFile!.content).toMatch(/@Json(Property|Value)/);
    });

    it('should generate enum types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const modelFiles = result.files.filter((f) => f.path.includes('/models/'));
      const hasEnum = modelFiles.some((f) => f.content.includes('public enum'));
      expect(hasEnum).toBe(true);
    });

    it('should use proper package structure', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const modelFile = result.files.find((f) => f.path.includes('/models/'));
      // Package should contain the base package name
      expect(modelFile!.content).toContain('package');
      expect(modelFile!.content).toMatch(/package [\w.]+\.models;/);
    });
  });

  describe('Client Generation', () => {
    it('should generate client class', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('Client.java'));
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('public class');
      expect(clientFile!.content).toContain('Client');
    });

    it('should use HttpClient', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('Client.java'));
      expect(clientFile!.content).toMatch(/HttpClient|import java\.net\.http/);
    });
  });

  describe('Manifest Generation', () => {
    it('should generate pom.xml', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const pomFile = result.files.find((f) => f.path === 'pom.xml');
      expect(pomFile).toBeDefined();
      expect(pomFile!.content).toContain('<project');
      expect(pomFile!.content).toContain('<groupId>');
      expect(pomFile!.content).toContain('<artifactId>');
    });

    it('should include Jackson dependency', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const pomFile = result.files.find((f) => f.path === 'pom.xml');
      expect(pomFile!.content).toContain('jackson');
    });

    it('should specify Java version', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const pomFile = result.files.find((f) => f.path === 'pom.xml');
      expect(pomFile!.content).toMatch(/<java\.version>|<maven\.compiler\.source>/);
    });
  });

  describe('Build Commands', () => {
    it('should provide build command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      expect(result.buildCommand).toBeDefined();
      expect(result.buildCommand).toContain('mvn');
    });

    it('should provide test command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      expect(result.testCommand).toBeDefined();
      expect(result.testCommand).toContain('mvn test');
    });

    it('should provide publish command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      expect(result.publishCommand).toBeDefined();
      expect(result.publishCommand).toContain('mvn deploy');
    });
  });

  describe('Integration', () => {
    it('should generate complete Maven project structure', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const hasPom = result.files.some((f) => f.path === 'pom.xml');
      const hasModels = result.files.some((f) => f.path.includes('/models/'));
      const hasClient = result.files.some((f) => f.path.includes('Client.java'));
      const hasReadme = result.files.some((f) => f.path === 'README.md');

      expect(hasPom).toBe(true);
      expect(hasModels).toBe(true);
      expect(hasClient).toBe(true);
      expect(hasReadme).toBe(true);
    });

    it('should use correct directory structure', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new JavaGenerator(schema, options);
      const result = await generator.generate();

      const srcMainJava = result.files.some((f) => f.path.startsWith('src/main/java/'));
      expect(srcMainJava).toBe(true);
    });
  });
});
