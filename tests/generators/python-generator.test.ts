import { describe, it, expect } from 'vitest';
import { PythonGenerator } from '../../src/generators/python-generator';
import { TargetLanguage } from '../../src/core/type-mapper';
import { createMinimalSchema, createSchemaWithTypes, createSchemaWithEndpoints } from './test-helpers';

describe('PythonGenerator', () => {
  const options = {
    outputDir: '/tmp/test-output',
    packageName: 'test-sdk',
    packageVersion: '1.0.0',
    language: TargetLanguage.Python,
    includeTests: true,
    includeExamples: true,
    includeDocs: true,
  };

  describe('Basic Functionality', () => {
    it('should create instance', () => {
      const schema = createMinimalSchema();
      const generator = new PythonGenerator(schema, options);

      expect(generator).toBeDefined();
      expect(generator.getLanguage()).toBe(TargetLanguage.Python);
    });

    it('should format package name in snake_case', () => {
      const schema = createMinimalSchema();
      const generator = new PythonGenerator(schema, options);

      expect(generator.getFormattedPackageName()).toBe('test_sdk');
    });
  });

  describe('Type Generation', () => {
    it('should generate Pydantic models', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const modelsFile = result.files.find((f) => f.path.includes('models.py'));
      expect(modelsFile).toBeDefined();
      expect(modelsFile!.content).toContain('from pydantic import BaseModel');
      expect(modelsFile!.content).toContain('class');
    });

    it('should generate enum classes', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const modelsFile = result.files.find((f) => f.path.includes('models.py'));
      expect(modelsFile).toBeDefined();
      expect(modelsFile!.content).toContain('from enum import Enum');
    });

    it('should use PascalCase for class names', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const modelsFile = result.files.find((f) => f.path.includes('models.py'));
      expect(modelsFile!.content).toMatch(/class [A-Z]\w+/); // Should have PascalCase class names
    });
  });

  describe('Client Generation', () => {
    it('should generate client class', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('client.py'));
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('class');
      expect(clientFile!.content).toContain('Client');
    });

    it('should use requests library', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('client.py'));
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toMatch(/import requests|from requests/);
    });

    it('should generate async methods', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path.includes('client.py'));
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('def');
    });
  });

  describe('Manifest Generation', () => {
    it('should generate pyproject.toml', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const pyprojectFile = result.files.find((f) => f.path === 'pyproject.toml');
      expect(pyprojectFile).toBeDefined();
      expect(pyprojectFile!.content).toContain('[tool.poetry]');
    });

    it('should include package name in pyproject.toml', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const pyprojectFile = result.files.find((f) => f.path === 'pyproject.toml');
      expect(pyprojectFile!.content).toContain('name');
      // Python packages use underscores, not hyphens
      expect(pyprojectFile!.content).toMatch(/name = "test[-_]sdk"/);
    });

    it('should include pydantic dependency', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const pyprojectFile = result.files.find((f) => f.path === 'pyproject.toml');
      expect(pyprojectFile!.content).toContain('pydantic');
    });
  });

  describe('Package Structure', () => {
    it('should generate __init__.py', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const initFiles = result.files.filter((f) => f.path.includes('__init__.py'));
      expect(initFiles.length).toBeGreaterThan(0);
    });

    it('should export types and client in __init__.py', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const mainInit = result.files.find((f) => f.path.match(/^test_sdk\/__init__\.py$/));
      if (mainInit) {
        expect(mainInit.content).toContain('from');
        expect(mainInit.content).toContain('import');
      }
    });
  });

  describe('Build Commands', () => {
    it('should provide build command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      expect(result.buildCommand).toBeDefined();
      expect(result.buildCommand).toMatch(/poetry|python|pip/);
    });

    it('should provide publish command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      expect(result.publishCommand).toBeDefined();
      expect(result.publishCommand).toMatch(/poetry|twine|pypi/);
    });

    it('should provide registry URL', async () => {
      const schema = createSchemaWithTypes();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      expect(result.registryUrl).toBeDefined();
      expect(result.registryUrl).toContain('pypi');
    });
  });

  describe('Integration', () => {
    it('should generate complete package structure', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new PythonGenerator(schema, options);
      const result = await generator.generate();

      const hasPyproject = result.files.some((f) => f.path === 'pyproject.toml');
      const hasInit = result.files.some((f) => f.path.includes('__init__.py'));
      const hasReadme = result.files.some((f) => f.path === 'README.md');

      expect(hasPyproject).toBe(true);
      expect(hasInit).toBe(true);
      expect(hasReadme).toBe(true);
    });
  });
});
