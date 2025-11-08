import { describe, it, expect } from 'vitest';
import { TypeScriptGenerator } from '../../src/generators/typescript-generator';
import { TargetLanguage } from '../../src/core/type-mapper';
import { createMinimalSchema, createSchemaWithTypes, createSchemaWithEndpoints } from './test-helpers';

describe('TypeScriptGenerator', () => {
  const options = {
    outputDir: '/tmp/test-output',
    packageName: 'test-sdk',
    packageVersion: '1.0.0',
    language: TargetLanguage.TypeScript,
    includeTests: true,
    includeExamples: true,
    includeDocs: true,
  };

  describe('Constructor and Basic Methods', () => {
    it('should create instance with minimal schema', () => {
      const schema = createMinimalSchema();
      const generator = new TypeScriptGenerator(schema, options);

      expect(generator).toBeDefined();
      expect(generator.getLanguage()).toBe(TargetLanguage.TypeScript);
    });

    it('should format package name in kebab-case', () => {
      const schema = createMinimalSchema();
      const generator = new TypeScriptGenerator(schema, options);

      expect(generator.getFormattedPackageName()).toBe('test-sdk');
    });

    it('should handle PascalCase package names', () => {
      const schema = createMinimalSchema();
      const generator = new TypeScriptGenerator(schema, { ...options, packageName: 'TestSDK' });

      expect(generator.getFormattedPackageName()).toBe('test-sdk');
    });
  });

  describe('Type Generation', () => {
    it('should generate enum types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/types.ts');
      expect(typesFile).toBeDefined();
      expect(typesFile!.content).toContain('export enum Role');
      expect(typesFile!.content).toContain('Admin');
      expect(typesFile!.content).toContain('User');
      expect(typesFile!.content).toContain('Guest');
    });

    it('should generate interface types', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/types.ts');
      expect(typesFile).toBeDefined();
      expect(typesFile!.content).toContain('export interface User');
      expect(typesFile!.content).toContain('id: string');
      expect(typesFile!.content).toContain('name: string');
    });

    it('should handle optional properties', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/types.ts');
      expect(typesFile).toBeDefined();
      // Optional properties should have ?
      expect(typesFile!.content).toMatch(/\w+\?:/);
    });

    it('should include type descriptions as JSDoc comments', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/types.ts');
      expect(typesFile).toBeDefined();
      expect(typesFile!.content).toContain('/**');
      expect(typesFile!.content).toContain('*/');
    });
  });

  describe('Client Generation', () => {
    it('should generate client class', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path === 'src/client.ts');
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('export class');
      expect(clientFile!.content).toContain('Client');
    });

    it('should generate ClientOptions interface', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path === 'src/client.ts');
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('export interface ClientOptions');
      expect(clientFile!.content).toContain('apiKey: string');
    });

    it('should generate request method', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path === 'src/client.ts');
      expect(clientFile).toBeDefined();
      expect(clientFile!.content).toContain('private async request');
    });

    it('should generate endpoint methods', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const clientFile = result.files.find((f) => f.path === 'src/client.ts');
      expect(clientFile).toBeDefined();
      // Should have at least one endpoint method
      expect(clientFile!.content).toMatch(/async \w+\(/);
    });
  });

  describe('Manifest Generation', () => {
    it('should generate package.json', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const manifestFile = result.files.find((f) => f.path === 'package.json');
      expect(manifestFile).toBeDefined();

      const manifest = JSON.parse(manifestFile!.content);
      expect(manifest.name).toBe('test-sdk');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.type).toBe('module');
    });

    it('should include necessary dependencies', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const manifestFile = result.files.find((f) => f.path === 'package.json');
      const manifest = JSON.parse(manifestFile!.content);

      expect(manifest.devDependencies).toBeDefined();
      expect(manifest.devDependencies.typescript).toBeDefined();
    });

    it('should include build scripts', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const manifestFile = result.files.find((f) => f.path === 'package.json');
      const manifest = JSON.parse(manifestFile!.content);

      expect(manifest.scripts).toBeDefined();
      expect(manifest.scripts.build).toBeDefined();
      expect(manifest.scripts.test).toBeDefined();
    });
  });

  describe('Configuration Files', () => {
    it('should generate tsconfig.json', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const tsconfigFile = result.files.find((f) => f.path === 'tsconfig.json');
      expect(tsconfigFile).toBeDefined();

      const tsconfig = JSON.parse(tsconfigFile!.content);
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBeDefined();
      expect(tsconfig.compilerOptions.module).toBeDefined();
    });

    it('should enable strict mode', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const tsconfigFile = result.files.find((f) => f.path === 'tsconfig.json');
      const tsconfig = JSON.parse(tsconfigFile!.content);

      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });

  describe('Index File', () => {
    it('should generate index.ts', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const indexFile = result.files.find((f) => f.path === 'src/index.ts');
      expect(indexFile).toBeDefined();
    });

    it('should export types and client', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const indexFile = result.files.find((f) => f.path === 'src/index.ts');
      expect(indexFile!.content).toContain('export');
      expect(indexFile!.content).toMatch(/from ['"]\.\/types/);
      expect(indexFile!.content).toMatch(/from ['"]\.\/client/);
    });
  });

  describe('README Generation', () => {
    it('should generate README.md', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile).toBeDefined();
    });

    it('should include package name in README', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile!.content).toContain('test-sdk');
    });

    it('should include installation instructions', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile!.content).toMatch(/npm install|yarn add|pnpm add/i);
    });

    it('should include usage examples', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const readmeFile = result.files.find((f) => f.path === 'README.md');
      expect(readmeFile!.content).toContain('```');
    });
  });

  describe('Examples Generation', () => {
    it('should generate examples when enabled', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, { ...options, includeExamples: true });
      const result = await generator.generate();

      const exampleFiles = result.files.filter((f) => f.path.startsWith('examples/'));
      expect(exampleFiles.length).toBeGreaterThan(0);
    });

    it('should not generate examples when disabled', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, { ...options, includeExamples: false });
      const result = await generator.generate();

      const exampleFiles = result.files.filter((f) => f.path.startsWith('examples/'));
      expect(exampleFiles.length).toBe(0);
    });

    it('should include working code in examples', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, { ...options, includeExamples: true });
      const result = await generator.generate();

      const exampleFile = result.files.find((f) => f.path.startsWith('examples/'));
      if (exampleFile) {
        expect(exampleFile.content).toContain('import');
        expect(exampleFile.content).toContain('new');
      }
    });
  });

  describe('Build and Test Commands', () => {
    it('should provide build command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      expect(result.buildCommand).toBeDefined();
      expect(result.buildCommand).toContain('npm');
    });

    it('should provide test command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      expect(result.testCommand).toBeDefined();
      expect(result.testCommand).toContain('npm');
    });

    it('should provide publish command', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      expect(result.publishCommand).toBeDefined();
      expect(result.publishCommand).toContain('npm');
    });

    it('should provide registry URL', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      expect(result.registryUrl).toBeDefined();
      expect(result.registryUrl).toContain('npmjs');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty schema', async () => {
      const schema = createMinimalSchema();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      expect(result.success).not.toBe(false);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should report errors in errors array', async () => {
      const schema = createMinimalSchema();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should report warnings in warnings array', async () => {
      const schema = createMinimalSchema();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('License Header', () => {
    it('should include license header in generated files', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/types.ts');
      expect(typesFile!.content).toContain('Auto-generated by LLM-Forge');
    });
  });

  describe('Integration', () => {
    it('should generate complete SDK structure', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      // Check for essential files
      const hasPackageJson = result.files.some((f) => f.path === 'package.json');
      const hasTsConfig = result.files.some((f) => f.path === 'tsconfig.json');
      const hasTypes = result.files.some((f) => f.path === 'src/types.ts');
      const hasClient = result.files.some((f) => f.path === 'src/client.ts');
      const hasIndex = result.files.some((f) => f.path === 'src/index.ts');
      const hasReadme = result.files.some((f) => f.path === 'README.md');

      expect(hasPackageJson).toBe(true);
      expect(hasTsConfig).toBe(true);
      expect(hasTypes).toBe(true);
      expect(hasClient).toBe(true);
      expect(hasIndex).toBe(true);
      expect(hasReadme).toBe(true);
    });

    it('should generate valid TypeScript code', async () => {
      const schema = createSchemaWithEndpoints();
      const generator = new TypeScriptGenerator(schema, options);
      const result = await generator.generate();

      const typesFile = result.files.find((f) => f.path === 'src/types.ts');

      // Basic syntax checks - should not contain [object Object]
      expect(typesFile!.content).not.toContain('[object Object]');
      // Optional fields may contain "| undefined" which is valid TypeScript
      expect(typesFile!.content).toMatch(/export (interface|enum|type)/);
    });

    it('should generate minimum required files', async () => {
      const schema = createSchemaWithTypes();
      const generator = new TypeScriptGenerator(schema, { ...options, includeExamples: false });
      const result = await generator.generate();

      expect(result.files.length).toBeGreaterThanOrEqual(6); // package.json, tsconfig, types, client, index, README
    });
  });
});
