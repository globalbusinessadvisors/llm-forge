/**
 * LLM-Forge CLI
 *
 * Command-line interface for the LLM-Forge SDK generator.
 *
 * @module cli
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { parseOpenAPI } from '../parsers/openapi-parser.js';
import { validator } from '../schema/validator.js';

const program = new Command();

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../package.json'), 'utf-8')
);

program
  .name('llm-forge')
  .description('Cross-provider SDK generator for Large Language Model APIs')
  .version(packageJson.version);

/**
 * Parse command
 */
program
  .command('parse')
  .description('Parse an OpenAPI specification and output canonical schema')
  .argument('<input>', 'OpenAPI specification file (JSON or YAML)')
  .option('-p, --provider <id>', 'Provider ID (e.g., openai, anthropic)', 'unknown')
  .option('-n, --provider-name <name>', 'Provider display name')
  .option('-o, --output <file>', 'Output file for canonical schema (JSON)')
  .option('--no-resolve', 'Do not resolve external $ref references')
  .option('--strict', 'Strict mode (fail on warnings)')
  .action(async (input, options) => {
    const spinner = ora('Parsing OpenAPI specification...').start();

    try {
      // Parse OpenAPI
      const result = await parseOpenAPI(input, {
        providerId: options.provider,
        providerName: options.providerName ?? options.provider,
        resolveRefs: options.resolve,
        strict: options.strict,
      });

      if (!result.success || !result.schema) {
        spinner.fail('Parse failed');
        console.error(chalk.red('Errors:'));
        result.errors.forEach((err) => console.error(chalk.red(`  - ${err}`)));

        if (result.warnings.length > 0) {
          console.warn(chalk.yellow('Warnings:'));
          result.warnings.forEach((warn) => console.warn(chalk.yellow(`  - ${warn}`)));
        }

        process.exit(1);
      }

      spinner.text = 'Validating canonical schema...';

      // Validate canonical schema
      const validation = validator.validate(result.schema);

      if (!validation.valid) {
        spinner.fail('Validation failed');
        console.error(chalk.red('Validation errors:'));
        validation.errors.forEach((err) =>
          console.error(chalk.red(`  ${err.path}: ${err.message}`))
        );
        process.exit(1);
      }

      spinner.succeed('Parse and validation successful');

      // Output results
      console.log(chalk.green('\n✓ Canonical Schema Generated'));
      console.log(chalk.gray(`  Provider: ${result.schema.metadata.providerName}`));
      console.log(chalk.gray(`  API Version: ${result.schema.metadata.apiVersion}`));
      console.log(chalk.gray(`  Types: ${result.schema.types.length}`));
      console.log(chalk.gray(`  Endpoints: ${result.schema.endpoints.length}`));
      console.log(chalk.gray(`  Auth Schemes: ${result.schema.authentication.length}`));

      if (result.warnings.length > 0) {
        console.warn(chalk.yellow(`\nWarnings (${result.warnings.length}):`));
        result.warnings.forEach((warn) => console.warn(chalk.yellow(`  - ${warn}`)));
      }

      // Write output if specified
      if (options.output) {
        const { writeFileSync } = await import('fs');
        writeFileSync(options.output, JSON.stringify(result.schema, null, 2));
        console.log(chalk.green(`\n✓ Written to ${options.output}`));
      } else {
        // Output to console
        console.log(chalk.gray('\nCanonical Schema:'));
        console.log(JSON.stringify(result.schema, null, 2));
      }
    } catch (error) {
      spinner.fail('Unexpected error');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

/**
 * Generate command
 */
program
  .command('generate')
  .description('Generate SDKs from canonical schema or OpenAPI spec')
  .argument('[input]', 'Canonical schema (JSON) or OpenAPI spec (JSON/YAML)')
  .option('-l, --lang <languages...>', 'Target languages (python, typescript, rust, go, java, csharp)')
  .option('-o, --output <dir>', 'Output directory', './generated')
  .option('-n, --name <name>', 'Package name', 'my-llm-sdk')
  .option('--pkg-version <version>', 'Package version', '0.1.0')
  .option('-p, --provider <id>', 'Provider ID (e.g., openai, anthropic)')
  .option('--provider-name <name>', 'Provider display name')
  .option('--no-parallel', 'Disable parallel generation')
  .action(async (input, options) => {
    const spinner = ora('Generating SDKs...').start();

    try {
      const { parseOpenAPI } = await import('../parsers/openapi-parser.js');
      const { GeneratorOrchestrator } = await import('../generators/generator-orchestrator.js');
      const { TargetLanguage } = await import('../core/type-mapper.js');

      let schema;

      // If input is provided, parse it
      if (input) {
        spinner.text = 'Parsing input specification...';

        // Check if it's already a canonical schema or needs parsing
        const inputData = JSON.parse(
          (await import('fs')).readFileSync(input, 'utf-8')
        );

        if (inputData.metadata && inputData.types && inputData.endpoints) {
          // Already a canonical schema
          schema = inputData;
        } else {
          // Parse as OpenAPI
          const result = await parseOpenAPI(input, {
            providerId: options.provider ?? 'unknown',
            providerName: options.providerName ?? options.provider ?? 'Unknown Provider',
          });

          if (!result.success || !result.schema) {
            spinner.fail('Parse failed');
            console.error(chalk.red('Errors:'));
            result.errors.forEach((err) => console.error(chalk.red(`  - ${err}`)));
            process.exit(1);
          }

          schema = result.schema;
        }
      } else {
        spinner.fail('No input file specified');
        console.error(chalk.red('Please provide an OpenAPI spec or canonical schema file'));
        process.exit(1);
      }

      spinner.text = 'Generating SDKs...';

      // Parse target languages
      const languageMap: Record<string, typeof TargetLanguage[keyof typeof TargetLanguage]> = {
        python: TargetLanguage.Python,
        typescript: TargetLanguage.TypeScript,
        ts: TargetLanguage.TypeScript,
        javascript: TargetLanguage.JavaScript,
        js: TargetLanguage.JavaScript,
        rust: TargetLanguage.Rust,
        go: TargetLanguage.Go,
        java: TargetLanguage.Java,
        csharp: TargetLanguage.CSharp,
        'c#': TargetLanguage.CSharp,
        cs: TargetLanguage.CSharp,
      };

      const languages = (options.lang ?? ['python', 'typescript'])
        .map((lang: string) => languageMap[lang.toLowerCase()])
        .filter((lang: typeof TargetLanguage[keyof typeof TargetLanguage] | undefined): lang is typeof TargetLanguage[keyof typeof TargetLanguage] => lang !== undefined);

      if (languages.length === 0) {
        spinner.fail('No valid languages specified');
        process.exit(1);
      }

      // Create orchestrator
      const orchestrator = new GeneratorOrchestrator(schema, {
        languages,
        outputDir: options.output,
        packageName: options.name,
        packageVersion: options.pkgVersion,
        parallel: options.parallel,
        writeFiles: true,
      });

      // Generate
      const result = await orchestrator.generate();

      if (result.success) {
        spinner.succeed('SDK generation complete');

        console.log(chalk.green(`\n✓ Generated ${result.totalFiles} files for ${languages.length} language(s)`));
        console.log(chalk.gray(`  Output directory: ${options.output}`));
        console.log(chalk.gray(`  Generation time: ${result.duration}ms`));

        if (result.totalWarnings > 0) {
          console.log(chalk.yellow(`\n⚠ ${result.totalWarnings} warning(s)`));
        }

        // Show build instructions
        console.log(chalk.cyan('\n' + orchestrator.getBuildInstructions(result.results)));
      } else {
        spinner.fail('SDK generation failed');
        console.error(chalk.red(`\n✗ ${result.totalErrors} error(s)`));

        for (const [lang, langResult] of result.results.entries()) {
          if (langResult.errors.length > 0) {
            console.error(chalk.red(`\n${lang}:`));
            langResult.errors.forEach((err) => console.error(chalk.red(`  - ${err}`)));
          }
        }

        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Unexpected error');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
