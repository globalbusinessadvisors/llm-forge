/**
 * Generator Orchestrator
 *
 * Coordinates multi-language SDK generation with parallel execution,
 * progress tracking, and quality validation.
 *
 * @module generators/generator-orchestrator
 */

import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import type { CanonicalSchema } from '../types/canonical-schema.js';
import type { BaseGenerator } from './base-generator.js';
import type { GenerationOptions, GenerationResult } from './base-generator.js';
import { PythonGenerator } from './python-generator.js';
import { TypeScriptGenerator } from './typescript-generator.js';
import { RustGenerator } from './rust-generator.js';
import { GoGenerator } from './go-generator.js';
import { CSharpGenerator } from './csharp-generator.js';
import { JavaGenerator } from './java-generator.js';
import { TargetLanguage } from '../core/type-mapper.js';

/**
 * Generator constructor type
 */
type GeneratorConstructor = new (
  schema: CanonicalSchema,
  options: GenerationOptions
) => BaseGenerator;

/**
 * Supported generators
 */
const GENERATORS: Record<TargetLanguage, GeneratorConstructor> = {
  [TargetLanguage.Python]: PythonGenerator,
  [TargetLanguage.TypeScript]: TypeScriptGenerator,
  [TargetLanguage.Rust]: RustGenerator,
  [TargetLanguage.JavaScript]: TypeScriptGenerator, // Same as TS but different build
  [TargetLanguage.CSharp]: CSharpGenerator,
  [TargetLanguage.Go]: GoGenerator,
  [TargetLanguage.Java]: JavaGenerator,
};

/**
 * Orchestrator options
 */
export interface OrchestratorOptions {
  /** Languages to generate */
  languages: TargetLanguage[];
  /** Base output directory */
  outputDir: string;
  /** Package name */
  packageName: string;
  /** Package version */
  packageVersion: string;
  /** License */
  license?: string;
  /** Parallel execution */
  parallel?: boolean;
  /** Write files to disk */
  writeFiles?: boolean;
}

/**
 * Orchestration result
 */
export interface OrchestrationResult {
  /** Results per language */
  results: Map<TargetLanguage, GenerationResult>;
  /** Overall success */
  success: boolean;
  /** Total files generated */
  totalFiles: number;
  /** Total warnings */
  totalWarnings: number;
  /** Total errors */
  totalErrors: number;
  /** Generation time in ms */
  duration: number;
}

/**
 * Generator Orchestrator
 *
 * Manages multi-language SDK generation with support for parallel execution,
 * file system operations, and comprehensive reporting.
 */
export class GeneratorOrchestrator {
  private schema: CanonicalSchema;
  private options: Required<OrchestratorOptions>;

  constructor(schema: CanonicalSchema, options: OrchestratorOptions) {
    this.schema = schema;
    this.options = {
      license: 'Apache-2.0',
      parallel: true,
      writeFiles: true,
      ...options,
    };
  }

  /**
   * Generate SDKs for all specified languages
   */
  async generate(): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results = new Map<TargetLanguage, GenerationResult>();

    // Generate for each language
    if (this.options.parallel) {
      // Parallel execution
      const promises = this.options.languages.map((lang) => this.generateForLanguage(lang));
      const generationResults = await Promise.all(promises);

      this.options.languages.forEach((lang, idx) => {
        results.set(lang, generationResults[idx]!);
      });
    } else {
      // Sequential execution
      for (const lang of this.options.languages) {
        const result = await this.generateForLanguage(lang);
        results.set(lang, result);
      }
    }

    // Write files if requested
    if (this.options.writeFiles) {
      await this.writeAllFiles(results);
    }

    // Calculate metrics
    const duration = Date.now() - startTime;
    let totalFiles = 0;
    let totalWarnings = 0;
    let totalErrors = 0;
    let success = true;

    for (const result of results.values()) {
      totalFiles += result.files.length;
      totalWarnings += result.warnings.length;
      totalErrors += result.errors.length;
      if (result.errors.length > 0) {
        success = false;
      }
    }

    return {
      results,
      success,
      totalFiles,
      totalWarnings,
      totalErrors,
      duration,
    };
  }

  /**
   * Generate SDK for a specific language
   */
  private async generateForLanguage(language: TargetLanguage): Promise<GenerationResult> {
    const GeneratorClass = GENERATORS[language];

    if (!GeneratorClass) {
      return {
        files: [],
        warnings: [],
        errors: [`No generator available for language: ${language}`],
      };
    }

    const languageDir = resolve(this.options.outputDir, this.getLanguageDirName(language));

    const generationOptions: GenerationOptions = {
      outputDir: languageDir,
      packageName: this.options.packageName,
      packageVersion: this.options.packageVersion,
      license: this.options.license,
      includeExamples: true,
      includeTests: true,
    };

    const generator = new GeneratorClass(this.schema, generationOptions);

    try {
      return await generator.generate();
    } catch (error) {
      return {
        files: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Write all generated files to disk
   */
  private async writeAllFiles(results: Map<TargetLanguage, GenerationResult>): Promise<void> {
    const writePromises: Promise<void>[] = [];

    for (const [language, result] of results.entries()) {
      const languageDir = resolve(this.options.outputDir, this.getLanguageDirName(language));

      for (const file of result.files) {
        const filePath = resolve(languageDir, file.path);
        writePromises.push(this.writeFile(filePath, file.content, file.executable));
      }
    }

    await Promise.all(writePromises);
  }

  /**
   * Write a single file to disk
   */
  private async writeFile(
    path: string,
    content: string,
    executable: boolean = false
  ): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, { mode: executable ? 0o755 : 0o644 });
  }

  /**
   * Get directory name for a language
   */
  private getLanguageDirName(language: TargetLanguage): string {
    const names: Record<TargetLanguage, string> = {
      [TargetLanguage.TypeScript]: 'typescript',
      [TargetLanguage.Python]: 'python',
      [TargetLanguage.Rust]: 'rust',
      [TargetLanguage.JavaScript]: 'javascript',
      [TargetLanguage.CSharp]: 'csharp',
      [TargetLanguage.Go]: 'go',
      [TargetLanguage.Java]: 'java',
    };

    return names[language];
  }

  /**
   * Get build instructions for all languages
   */
  getBuildInstructions(results: Map<TargetLanguage, GenerationResult>): string {
    const instructions: string[] = ['# Build Instructions\n'];

    for (const [language, result] of results.entries()) {
      if (result.buildCommand) {
        instructions.push(`## ${language}`);
        instructions.push('```bash');
        instructions.push(`cd ${this.getLanguageDirName(language)}`);
        instructions.push(result.buildCommand);
        instructions.push('```\n');
      }
    }

    return instructions.join('\n');
  }

  /**
   * Get test instructions for all languages
   */
  getTestInstructions(results: Map<TargetLanguage, GenerationResult>): string {
    const instructions: string[] = ['# Test Instructions\n'];

    for (const [language, result] of results.entries()) {
      if (result.testCommand) {
        instructions.push(`## ${language}`);
        instructions.push('```bash');
        instructions.push(`cd ${this.getLanguageDirName(language)}`);
        instructions.push(result.testCommand);
        instructions.push('```\n');
      }
    }

    return instructions.join('\n');
  }

  /**
   * Get publish instructions for all languages
   */
  getPublishInstructions(results: Map<TargetLanguage, GenerationResult>): string {
    const instructions: string[] = ['# Publish Instructions\n'];

    for (const [language, result] of results.entries()) {
      if (result.publishCommand) {
        instructions.push(`## ${language}`);
        instructions.push('```bash');
        instructions.push(`cd ${this.getLanguageDirName(language)}`);
        instructions.push(result.publishCommand);
        instructions.push('```');

        if (result.registryUrl) {
          instructions.push(`\nRegistry: ${result.registryUrl}\n`);
        }
      }
    }

    return instructions.join('\n');
  }
}

/**
 * Generate SDKs for multiple languages (convenience function)
 *
 * @param schema - Canonical schema
 * @param options - Orchestrator options
 * @returns Orchestration result
 */
export async function generateMultiLanguageSDKs(
  schema: CanonicalSchema,
  options: OrchestratorOptions
): Promise<OrchestrationResult> {
  const orchestrator = new GeneratorOrchestrator(schema, options);
  return orchestrator.generate();
}
