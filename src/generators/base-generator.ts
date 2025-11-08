/**
 * Base Generator
 *
 * Abstract base class for all language-specific SDK generators.
 * Provides common functionality and enforces a consistent interface.
 *
 * @module generators/base-generator
 */

import type { CanonicalSchema } from '../types/canonical-schema.js';
import type { TargetLanguage } from '../core/type-mapper.js';

/**
 * Generated file
 */
export interface GeneratedFile {
  /** File path relative to output directory */
  path: string;
  /** File content */
  content: string;
  /** Whether this file is executable */
  executable?: boolean;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  /** Output directory */
  outputDir: string;
  /** Package name */
  packageName: string;
  /** Package version */
  packageVersion: string;
  /** License */
  license?: string;
  /** Whether to include examples */
  includeExamples?: boolean;
  /** Whether to include tests */
  includeTests?: boolean;
  /** Custom template directory */
  templateDir?: string;
}

/**
 * Generation result
 */
export interface GenerationResult {
  /** Generated files */
  files: GeneratedFile[];
  /** Build command (if any) */
  buildCommand?: string;
  /** Test command (if any) */
  testCommand?: string;
  /** Publish command (if any) */
  publishCommand?: string;
  /** Package registry URL */
  registryUrl?: string;
  /** Warnings */
  warnings: string[];
  /** Errors */
  errors: string[];
}

/**
 * Abstract base generator class
 */
export abstract class BaseGenerator {
  protected schema: CanonicalSchema;
  protected options: Required<GenerationOptions>;

  constructor(schema: CanonicalSchema, options: GenerationOptions) {
    this.schema = schema;
    this.options = {
      license: 'Apache-2.0',
      includeExamples: true,
      includeTests: true,
      templateDir: '',
      ...options,
    };
  }

  /**
   * Get the target language for this generator
   */
  abstract getLanguage(): TargetLanguage;

  /**
   * Get the package name formatted for this language
   */
  abstract getFormattedPackageName(): string;

  /**
   * Generate SDK files
   */
  abstract generate(): Promise<GenerationResult>;

  /**
   * Generate type definitions
   */
  protected abstract generateTypes(): Promise<GeneratedFile[]>;

  /**
   * Generate API client
   */
  protected abstract generateClient(): Promise<GeneratedFile[]>;

  /**
   * Generate package manifest (package.json, Cargo.toml, etc.)
   */
  protected abstract generateManifest(): Promise<GeneratedFile>;

  /**
   * Generate README
   */
  protected abstract generateReadme(): Promise<GeneratedFile>;

  /**
   * Generate examples (optional)
   */
  protected async generateExamples(): Promise<GeneratedFile[]> {
    return [];
  }

  /**
   * Generate tests (optional)
   */
  protected async generateTests(): Promise<GeneratedFile[]> {
    return [];
  }

  /**
   * Get build command for this language
   */
  protected abstract getBuildCommand(): string | undefined;

  /**
   * Get test command for this language
   */
  protected abstract getTestCommand(): string | undefined;

  /**
   * Get publish command for this language
   */
  protected abstract getPublishCommand(): string | undefined;

  /**
   * Get package registry URL
   */
  protected abstract getRegistryUrl(): string | undefined;

  /**
   * Sanitize package name for the target language
   */
  protected sanitizePackageName(name: string): string {
    // Default implementation: lowercase with hyphens
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Convert string to PascalCase
   */
  protected toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (c) => c.toUpperCase());
  }

  /**
   * Convert string to camelCase
   */
  protected toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Convert string to snake_case
   */
  protected toSnakeCase(str: string): string {
    return str
      // Handle consecutive uppercase letters (e.g., "XMLParser" -> "xml_parser")
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      // Handle normal PascalCase (e.g., "MyClass" -> "my_class")
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/[-\s]/g, '_')
      // Remove multiple consecutive underscores
      .replace(/_+/g, '_');
  }

  /**
   * Convert string to kebab-case
   */
  protected toKebabCase(str: string): string {
    return this.toSnakeCase(str).replace(/_/g, '-');
  }

  /**
   * Get current timestamp in ISO format
   */
  protected getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Add Apache 2.0 license header
   */
  protected addLicenseHeader(content: string, commentStyle: 'slashes' | 'hash' = 'slashes'): string {
    const year = new Date().getFullYear();
    const commentStart = commentStyle === 'slashes' ? '//' : '#';

    const header = [
      `${commentStart} Copyright ${year} LLM-Forge`,
      `${commentStart}`,
      `${commentStart} Licensed under the Apache License, Version 2.0 (the "License");`,
      `${commentStart} you may not use this file except in compliance with the License.`,
      `${commentStart} You may obtain a copy of the License at`,
      `${commentStart}`,
      `${commentStart}     http://www.apache.org/licenses/LICENSE-2.0`,
      `${commentStart}`,
      `${commentStart} Unless required by applicable law or agreed to in writing, software`,
      `${commentStart} distributed under the License is distributed on an "AS IS" BASIS,`,
      `${commentStart} WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.`,
      `${commentStart} See the License for the specific language governing permissions and`,
      `${commentStart} limitations under the License.`,
      '',
    ].join('\n');

    return header + '\n' + content;
  }
}
