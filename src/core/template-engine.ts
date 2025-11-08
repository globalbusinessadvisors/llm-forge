/**
 * Template Engine - Handlebars setup with custom helpers
 *
 * Provides enterprise-grade template rendering with comprehensive helper library
 * for code generation across multiple programming languages.
 *
 * @module core/template-engine
 */

import Handlebars from 'handlebars';

/**
 * Template rendering options
 */
export interface TemplateOptions {
  /** Whether to enable strict mode (throws on missing variables) */
  strict?: boolean;
  /** Custom data to pass to all templates */
  data?: Record<string, unknown>;
  /** Whether to enable runtime compilation caching */
  cache?: boolean;
}

/**
 * Template rendering result
 */
export interface RenderResult {
  /** Rendered output */
  output: string;
  /** Any warnings generated during rendering */
  warnings: string[];
}

/**
 * Helper function signature
 */
export type HelperFunction = (...args: unknown[]) => string | Handlebars.SafeString;

/**
 * Template Engine with Handlebars and custom helpers
 *
 * Provides comprehensive template rendering capabilities with:
 * - Case conversion helpers (camelCase, PascalCase, snake_case, kebab-case)
 * - String manipulation (upper, lower, capitalize, trim, etc.)
 * - Comparison operators (eq, ne, lt, gt, and, or)
 * - Array/object utilities (length, join, contains, keys, values)
 * - Code formatting helpers (indent, comment, escape)
 * - Conditional helpers (if, unless, with, each)
 *
 * @example
 * ```typescript
 * const engine = new TemplateEngine();
 * const result = engine.render('Hello {{capitalize name}}!', { name: 'world' });
 * console.log(result.output); // "Hello World!"
 * ```
 */
export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate>;
  private options: Required<TemplateOptions>;
  private warnings: string[];

  constructor(options: TemplateOptions = {}) {
    this.handlebars = Handlebars.create();
    this.compiledTemplates = new Map();
    this.warnings = [];

    this.options = {
      strict: options.strict ?? false,
      data: options.data ?? {},
      cache: options.cache ?? true,
    };

    // Register all custom helpers
    this.registerCaseConversionHelpers();
    this.registerStringHelpers();
    this.registerComparisonHelpers();
    this.registerArrayHelpers();
    this.registerObjectHelpers();
    this.registerCodeHelpers();
    this.registerConditionalHelpers();
    this.registerMathHelpers();
  }

  /**
   * Render a template with the given context
   *
   * @param template - Handlebars template string
   * @param context - Data to pass to the template
   * @param options - Rendering options (overrides constructor options)
   * @returns Rendered output and warnings
   *
   * @example
   * ```typescript
   * const result = engine.render('{{#each items}}{{@index}}: {{this}}\n{{/each}}', {
   *   items: ['a', 'b', 'c']
   * });
   * ```
   */
  render(template: string, context: Record<string, unknown> = {}, options?: TemplateOptions): RenderResult {
    this.warnings = [];

    try {
      const mergedOptions = { ...this.options, ...options };
      let compiled: HandlebarsTemplateDelegate;

      if (mergedOptions.cache && this.compiledTemplates.has(template)) {
        compiled = this.compiledTemplates.get(template)!;
      } else {
        compiled = this.handlebars.compile(template, {
          strict: mergedOptions.strict,
          noEscape: false,
        });

        if (mergedOptions.cache) {
          this.compiledTemplates.set(template, compiled);
        }
      }

      const data = { ...mergedOptions.data };
      const output = compiled(context, { data });

      return {
        output,
        warnings: [...this.warnings],
      };
    } catch (error) {
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Register a custom helper function
   *
   * @param name - Helper name
   * @param fn - Helper function
   *
   * @example
   * ```typescript
   * engine.registerHelper('repeat', (str, count) => str.repeat(count));
   * ```
   */
  registerHelper(name: string, fn: HelperFunction): void {
    this.handlebars.registerHelper(name, fn);
  }

  /**
   * Register a partial template
   *
   * @param name - Partial name
   * @param template - Partial template string
   *
   * @example
   * ```typescript
   * engine.registerPartial('header', '<header>{{title}}</header>');
   * ```
   */
  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template);
  }

  /**
   * Unregister a helper
   *
   * @param name - Helper name
   */
  unregisterHelper(name: string): void {
    this.handlebars.unregisterHelper(name);
  }

  /**
   * Unregister a partial
   *
   * @param name - Partial name
   */
  unregisterPartial(name: string): void {
    this.handlebars.unregisterPartial(name);
  }

  /**
   * Clear compiled template cache
   */
  clearCache(): void {
    this.compiledTemplates.clear();
  }

  /**
   * Get the underlying Handlebars instance
   */
  getHandlebars(): typeof Handlebars {
    return this.handlebars;
  }

  // ========================================
  // CASE CONVERSION HELPERS
  // ========================================

  private registerCaseConversionHelpers(): void {
    /**
     * Convert string to camelCase
     * @example {{camelCase "hello world"}} -> helloWorld
     */
    this.handlebars.registerHelper('camelCase', (str: string) => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^(.)/, (c) => c.toLowerCase());
    });

    /**
     * Convert string to PascalCase
     * @example {{PascalCase "hello world"}} -> HelloWorld
     */
    this.handlebars.registerHelper('PascalCase', (str: string) => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^(.)/, (c) => c.toUpperCase());
    });

    /**
     * Convert string to snake_case
     * @example {{snake_case "helloWorld"}} -> hello_world
     */
    this.handlebars.registerHelper('snake_case', (str: string) => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/^_/, '')
        .replace(/[-\s]/g, '_')
        .replace(/_+/g, '_');
    });

    /**
     * Convert string to kebab-case
     * @example {{kebab-case "helloWorld"}} -> hello-world
     */
    this.handlebars.registerHelper('kebab-case', (str: string) => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/[\s_]/g, '-')
        .replace(/-+/g, '-');
    });

    /**
     * Convert string to SCREAMING_SNAKE_CASE
     * @example {{SCREAMING_SNAKE_CASE "helloWorld"}} -> HELLO_WORLD
     */
    this.handlebars.registerHelper('SCREAMING_SNAKE_CASE', (str: string) => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .toUpperCase()
        .replace(/^_/, '')
        .replace(/[-\s]/g, '_')
        .replace(/_+/g, '_');
    });
  }

  // ========================================
  // STRING MANIPULATION HELPERS
  // ========================================

  private registerStringHelpers(): void {
    /**
     * Convert string to uppercase
     * @example {{upper "hello"}} -> HELLO
     */
    this.handlebars.registerHelper('upper', (str: string) => {
      if (typeof str !== 'string') return '';
      return str.toUpperCase();
    });

    /**
     * Convert string to lowercase
     * @example {{lower "HELLO"}} -> hello
     */
    this.handlebars.registerHelper('lower', (str: string) => {
      if (typeof str !== 'string') return '';
      return str.toLowerCase();
    });

    /**
     * Capitalize first letter
     * @example {{capitalize "hello"}} -> Hello
     */
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (typeof str !== 'string') return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    /**
     * Trim whitespace
     * @example {{trim "  hello  "}} -> hello
     */
    this.handlebars.registerHelper('trim', (str: string) => {
      if (typeof str !== 'string') return '';
      return str.trim();
    });

    /**
     * Replace all occurrences
     * @example {{replace "hello world" "world" "there"}} -> hello there
     */
    this.handlebars.registerHelper('replace', (str: string, search: string, replacement: string) => {
      if (typeof str !== 'string') return '';
      return str.replace(new RegExp(search, 'g'), replacement);
    });

    /**
     * Substring
     * @example {{substring "hello" 0 3}} -> hel
     */
    this.handlebars.registerHelper('substring', (...args: unknown[]) => {
      const str = args[0] as string;
      const start = args[1] as number;
      const end = args[2] as number | undefined;
      // Last argument is Handlebars options, check if we have 3 or 4 args total
      const hasEnd = args.length > 3;

      if (typeof str !== 'string') return '';
      return hasEnd && typeof end === 'number' ? str.substring(start, end) : str.substring(start);
    });

    /**
     * Truncate string with ellipsis
     * @example {{truncate "hello world" 8}} -> hello...
     */
    this.handlebars.registerHelper('truncate', (...args: unknown[]) => {
      const str = args[0] as string;
      const length = args[1] as number;
      const suffix = args.length > 3 && typeof args[2] === 'string' ? args[2] : '...';

      if (typeof str !== 'string') return '';
      if (str.length <= length) return str;
      return str.substring(0, length) + suffix;
    });

    /**
     * Pluralize word
     * @example {{pluralize "item" 5}} -> items
     */
    this.handlebars.registerHelper('pluralize', (...args: unknown[]) => {
      const singular = args[0] as string;
      const count = args.length > 2 ? (args[1] as number) : undefined;
      const plural = args.length > 3 ? (args[2] as string) : undefined;

      if (typeof count === 'number' && count === 1) return singular;
      if (plural) return plural;
      // Simple pluralization
      if (singular.endsWith('s')) return singular + 'es';
      if (singular.endsWith('y')) return singular.slice(0, -1) + 'ies';
      return singular + 's';
    });

    /**
     * Concatenate strings
     * @example {{concat "hello" " " "world"}} -> hello world
     */
    this.handlebars.registerHelper('concat', (...args: unknown[]) => {
      // Remove Handlebars options object (last argument)
      const strings = args.slice(0, -1);
      return strings.join('');
    });
  }

  // ========================================
  // COMPARISON HELPERS
  // ========================================

  private registerComparisonHelpers(): void {
    /**
     * Equality comparison
     * @example {{#if (eq status "active")}}...{{/if}}
     */
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

    /**
     * Inequality comparison
     * @example {{#if (ne status "inactive")}}...{{/if}}
     */
    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);

    /**
     * Less than
     * @example {{#if (lt count 10)}}...{{/if}}
     */
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);

    /**
     * Less than or equal
     * @example {{#if (lte count 10)}}...{{/if}}
     */
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

    /**
     * Greater than
     * @example {{#if (gt count 0)}}...{{/if}}
     */
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);

    /**
     * Greater than or equal
     * @example {{#if (gte count 0)}}...{{/if}}
     */
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);

    /**
     * Logical AND
     * @example {{#if (and isActive isVerified)}}...{{/if}}
     */
    this.handlebars.registerHelper('and', (...args: unknown[]) => {
      // Remove Handlebars options object (last argument)
      const values = args.slice(0, -1);
      return values.every((v) => !!v);
    });

    /**
     * Logical OR
     * @example {{#if (or isAdmin isModerator)}}...{{/if}}
     */
    this.handlebars.registerHelper('or', (...args: unknown[]) => {
      // Remove Handlebars options object (last argument)
      const values = args.slice(0, -1);
      return values.some((v) => !!v);
    });

    /**
     * Logical NOT
     * @example {{#if (not isDisabled)}}...{{/if}}
     */
    this.handlebars.registerHelper('not', (value: unknown) => !value);
  }

  // ========================================
  // ARRAY HELPERS
  // ========================================

  private registerArrayHelpers(): void {
    /**
     * Get array length
     * @example {{length items}}
     */
    this.handlebars.registerHelper('length', (arr: unknown[] | string) => {
      if (Array.isArray(arr)) return arr.length;
      if (typeof arr === 'string') return arr.length;
      return 0;
    });

    /**
     * Join array elements
     * @example {{join items ", "}}
     */
    this.handlebars.registerHelper('join', (...args: unknown[]) => {
      const arr = args[0] as unknown[];
      const separator = args.length > 2 && typeof args[1] === 'string' ? args[1] : ', ';

      if (!Array.isArray(arr)) return '';
      return arr.join(separator);
    });

    /**
     * Check if array contains value
     * @example {{#if (contains items "foo")}}...{{/if}}
     */
    this.handlebars.registerHelper('contains', (arr: unknown[], value: unknown) => {
      if (!Array.isArray(arr)) return false;
      return arr.includes(value);
    });

    /**
     * Get first element
     * @example {{first items}}
     */
    this.handlebars.registerHelper('first', (arr: unknown[]) => {
      if (!Array.isArray(arr) || arr.length === 0) return undefined;
      return arr[0];
    });

    /**
     * Get last element
     * @example {{last items}}
     */
    this.handlebars.registerHelper('last', (arr: unknown[]) => {
      if (!Array.isArray(arr) || arr.length === 0) return undefined;
      return arr[arr.length - 1];
    });

    /**
     * Check if array is empty
     * @example {{#if (isEmpty items)}}...{{/if}}
     */
    this.handlebars.registerHelper('isEmpty', (arr: unknown[] | Record<string, unknown>) => {
      if (Array.isArray(arr)) return arr.length === 0;
      if (typeof arr === 'object' && arr !== null) return Object.keys(arr).length === 0;
      return true;
    });

    /**
     * Check if array is not empty
     * @example {{#if (isNotEmpty items)}}...{{/if}}
     */
    this.handlebars.registerHelper('isNotEmpty', (arr: unknown[] | Record<string, unknown>) => {
      if (Array.isArray(arr)) return arr.length > 0;
      if (typeof arr === 'object' && arr !== null) return Object.keys(arr).length > 0;
      return false;
    });
  }

  // ========================================
  // OBJECT HELPERS
  // ========================================

  private registerObjectHelpers(): void {
    /**
     * Get object keys
     * @example {{#each (keys obj)}}{{this}}{{/each}}
     */
    this.handlebars.registerHelper('keys', (obj: Record<string, unknown>) => {
      if (typeof obj !== 'object' || obj === null) return [];
      return Object.keys(obj);
    });

    /**
     * Get object values
     * @example {{#each (values obj)}}{{this}}{{/each}}
     */
    this.handlebars.registerHelper('values', (obj: Record<string, unknown>) => {
      if (typeof obj !== 'object' || obj === null) return [];
      return Object.values(obj);
    });

    /**
     * Get object entries
     * @example {{#each (entries obj)}}{{@key}}: {{this}}{{/each}}
     */
    this.handlebars.registerHelper('entries', (obj: Record<string, unknown>) => {
      if (typeof obj !== 'object' || obj === null) return [];
      return Object.entries(obj).map(([key, value]) => ({ key, value }));
    });

    /**
     * Check if object has property
     * @example {{#if (hasKey obj "name")}}...{{/if}}
     */
    this.handlebars.registerHelper('hasKey', (obj: Record<string, unknown>, key: string) => {
      if (typeof obj !== 'object' || obj === null) return false;
      return key in obj;
    });

    /**
     * Get property value
     * @example {{get obj "name"}}
     */
    this.handlebars.registerHelper('get', (obj: Record<string, unknown>, key: string) => {
      if (typeof obj !== 'object' || obj === null) return undefined;
      return obj[key];
    });
  }

  // ========================================
  // CODE FORMATTING HELPERS
  // ========================================

  private registerCodeHelpers(): void {
    /**
     * Indent text by specified number of spaces
     * @example {{indent text 4}}
     */
    this.handlebars.registerHelper('indent', (...args: unknown[]) => {
      const text = args[0] as string;
      const spaces = args.length > 2 ? args[1] : 2;

      if (typeof text !== 'string') return '';
      const numSpaces = typeof spaces === 'number' ? spaces : parseInt(String(spaces), 10);
      const indentation = ' '.repeat(numSpaces);
      return new Handlebars.SafeString(
        text
          .split('\n')
          .map((line) => (line.trim() ? indentation + line : line))
          .join('\n')
      );
    });

    /**
     * Add single-line comment
     * @example {{comment "TODO: Fix this" "//"}}
     */
    this.handlebars.registerHelper('comment', (...args: unknown[]) => {
      const text = args[0] as string;
      const commentStyle = args.length > 2 && typeof args[1] === 'string' ? args[1] : '//';

      if (typeof text !== 'string') return '';
      return new Handlebars.SafeString(`${commentStyle} ${text}`);
    });

    /**
     * Add multi-line comment
     * @example {{blockComment "Description here" "/" + "*" "*" + "/"}}
     */
    this.handlebars.registerHelper('blockComment', (...args: unknown[]) => {
      const text = args[0] as string;
      const startDelim = args.length > 2 && typeof args[1] === 'string' ? args[1] : '/*';
      const endDelim = args.length > 3 && typeof args[2] === 'string' ? args[2] : '*/';

      if (typeof text !== 'string') return '';
      const lines = text.split('\n');
      if (lines.length === 1) {
        return new Handlebars.SafeString(`${startDelim} ${text} ${endDelim}`);
      }
      return new Handlebars.SafeString(`${startDelim}\n${lines.map((line) => ` * ${line}`).join('\n')}\n ${endDelim}`);
    });

    /**
     * Escape string for code (add backslashes)
     * @example {{escape 'He said "hello"'}}
     */
    this.handlebars.registerHelper('escape', (text: string) => {
      if (typeof text !== 'string') return '';
      const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
      return new Handlebars.SafeString(escaped);
    });

    /**
     * Add JSDoc comment
     * @example {{jsDoc "Returns user data" "@param id User ID" "@returns User object"}}
     */
    this.handlebars.registerHelper('jsDoc', (...args: unknown[]) => {
      // Remove Handlebars options object (last argument)
      const lines = args.slice(0, -1).filter((line) => typeof line === 'string');
      if (lines.length === 0) return '';
      if (lines.length === 1) return `/** ${lines[0]} */`;
      return new Handlebars.SafeString(`/**\n${lines.map((line) => ` * ${line}`).join('\n')}\n */`);
    });

    /**
     * Wrap text at specified width
     * @example {{wrap text 80}}
     */
    this.handlebars.registerHelper('wrap', (text: string, width: number = 80) => {
      if (typeof text !== 'string') return '';
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        if (currentLine.length + word.length + 1 <= width) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) lines.push(currentLine);
      return lines.join('\n');
    });
  }

  // ========================================
  // CONDITIONAL HELPERS
  // ========================================

  private registerConditionalHelpers(): void {
    /**
     * Switch/case statement
     * @example
     * {{#switch value}}
     *   {{#case "a"}}Case A{{/case}}
     *   {{#case "b"}}Case B{{/case}}
     *   {{#default}}Default{{/default}}
     * {{/switch}}
     */
    this.handlebars.registerHelper('switch', function (this: unknown, value: unknown, options: Handlebars.HelperOptions) {
      // Store the value in the context for case helpers
      (options.data as { switchValue?: unknown }).switchValue = value;
      (options.data as { found?: boolean }).found = false;
      return options.fn(this);
    });

    this.handlebars.registerHelper('case', function (this: unknown, ...args: unknown[]) {
      const options = args[args.length - 1] as Handlebars.HelperOptions;
      const caseValues = args.slice(0, -1);
      const switchValue = (options.data as { switchValue?: unknown }).switchValue;
      const found = (options.data as { found?: boolean }).found;

      if (found) return '';

      if (caseValues.includes(switchValue)) {
        (options.data as { found?: boolean }).found = true;
        return options.fn(this);
      }

      return '';
    });

    this.handlebars.registerHelper('default', function (this: unknown, options: Handlebars.HelperOptions) {
      const found = (options.data as { found?: boolean }).found;
      if (!found) {
        return options.fn(this);
      }
      return '';
    });
  }

  // ========================================
  // MATH HELPERS
  // ========================================

  private registerMathHelpers(): void {
    /**
     * Add numbers
     * @example {{add 5 3}} -> 8
     */
    this.handlebars.registerHelper('add', (a: number, b: number) => a + b);

    /**
     * Subtract numbers
     * @example {{subtract 5 3}} -> 2
     */
    this.handlebars.registerHelper('subtract', (a: number, b: number) => a - b);

    /**
     * Multiply numbers
     * @example {{multiply 5 3}} -> 15
     */
    this.handlebars.registerHelper('multiply', (a: number, b: number) => a * b);

    /**
     * Divide numbers
     * @example {{divide 15 3}} -> 5
     */
    this.handlebars.registerHelper('divide', (a: number, b: number) => (b !== 0 ? a / b : 0));

    /**
     * Modulo operation
     * @example {{mod 10 3}} -> 1
     */
    this.handlebars.registerHelper('mod', (a: number, b: number) => (b !== 0 ? a % b : 0));

    /**
     * Absolute value
     * @example {{abs -5}} -> 5
     */
    this.handlebars.registerHelper('abs', (n: number) => Math.abs(n));

    /**
     * Round number
     * @example {{round 5.7}} -> 6
     */
    this.handlebars.registerHelper('round', (n: number) => Math.round(n));

    /**
     * Floor number
     * @example {{floor 5.7}} -> 5
     */
    this.handlebars.registerHelper('floor', (n: number) => Math.floor(n));

    /**
     * Ceil number
     * @example {{ceil 5.2}} -> 6
     */
    this.handlebars.registerHelper('ceil', (n: number) => Math.ceil(n));
  }
}
