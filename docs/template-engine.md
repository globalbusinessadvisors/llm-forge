# Template Engine

Enterprise-grade Handlebars template engine with comprehensive helper library for code generation.

## Overview

The Template Engine provides a powerful and flexible way to generate code across multiple programming languages. Built on Handlebars, it includes a rich set of custom helpers designed specifically for code generation tasks.

## Features

- **Case Conversion**: camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE_CASE
- **String Manipulation**: upper, lower, capitalize, trim, replace, substring, truncate, pluralize, concat
- **Comparison Operators**: eq, ne, lt, lte, gt, gte, and, or, not
- **Array Utilities**: length, join, contains, first, last, isEmpty, isNotEmpty
- **Object Utilities**: keys, values, entries, hasKey, get
- **Code Formatting**: indent, comment, blockComment, escape, jsDoc, wrap
- **Conditional Logic**: switch/case/default
- **Math Operations**: add, subtract, multiply, divide, mod, abs, round, floor, ceil
- **Template Caching**: Built-in compilation caching for improved performance
- **Partial Support**: Register and reuse template fragments

## Installation

```typescript
import { TemplateEngine } from '@llm-dev-ops/llm-forge';
```

## Basic Usage

### Creating an Engine Instance

```typescript
const engine = new TemplateEngine({
  cache: true,      // Enable template caching (default: true)
  strict: false,    // Strict mode for missing variables (default: false)
  data: {}          // Global data passed to all templates (default: {})
});
```

### Rendering Templates

```typescript
const result = engine.render(
  'Hello {{PascalCase name}}!',
  { name: 'world_user' }
);

console.log(result.output); // "Hello WorldUser!"
console.log(result.warnings); // []
```

## Helper Reference

### Case Conversion

```handlebars
{{camelCase "hello_world"}}           → helloWorld
{{PascalCase "hello_world"}}          → HelloWorld
{{snake_case "helloWorld"}}           → hello_world
{{kebab-case "helloWorld"}}           → hello-world
{{SCREAMING_SNAKE_CASE "helloWorld"}} → HELLO_WORLD
```

### String Manipulation

```handlebars
{{upper "hello"}}                     → HELLO
{{lower "HELLO"}}                     → hello
{{capitalize "hello"}}                → Hello
{{trim "  hello  "}}                  → hello
{{replace "hello world" "world" "there"}} → hello there
{{substring "hello" 0 3}}             → hel
{{truncate "hello world" 8}}          → hello wo...
{{pluralize "item" 5}}                → items
{{concat "hello" " " "world"}}        → hello world
```

### Comparison Helpers

```handlebars
{{#if (eq status "active")}}Active{{/if}}
{{#if (ne count 0)}}Has items{{/if}}
{{#if (gt count 5)}}Many items{{/if}}
{{#if (and isActive isVerified)}}Verified{{/if}}
{{#if (or isAdmin isModerator)}}Has permissions{{/if}}
{{#if (not isDisabled)}}Enabled{{/if}}
```

### Array Helpers

```handlebars
{{length items}}                      → 3
{{join items ", "}}                   → a, b, c
{{first items}}                       → first element
{{last items}}                        → last element
{{#if (contains items "foo")}}Found{{/if}}
{{#if (isEmpty items)}}No items{{/if}}
```

### Object Helpers

```handlebars
{{#each (keys obj)}}{{this}}{{/each}}
{{#each (values obj)}}{{this}}{{/each}}
{{#each (entries obj)}}{{key}}: {{value}}{{/each}}
{{#if (hasKey obj "name")}}Has name{{/if}}
{{get obj "propertyName"}}
```

### Code Formatting

```handlebars
{{indent code 4}}                     → Indents each line by 4 spaces
{{comment "TODO: Fix this" "//"}}     → // TODO: Fix this
{{comment "Python comment" "#"}}      → # Python comment
{{blockComment "Description"}}        → /* Description */
{{escape 'He said "hello"'}}          → He said \"hello\"
{{jsDoc "Description" "@param x" "@returns y"}}
{{wrap text 80}}                      → Wraps text at 80 characters
```

### Conditional Logic

```handlebars
{{#switch type}}
  {{#case "string"}}String type{{/case}}
  {{#case "number"}}Number type{{/case}}
  {{#default}}Unknown type{{/default}}
{{/switch}}
```

### Math Operations

```handlebars
{{add 5 3}}                           → 8
{{subtract 10 4}}                     → 6
{{multiply 3 7}}                      → 21
{{divide 15 3}}                       → 5
{{mod 10 3}}                          → 1
{{abs -5}}                            → 5
{{round 5.7}}                         → 6
{{floor 5.9}}                         → 5
{{ceil 5.1}}                          → 6
```

## Code Generation Examples

### TypeScript Interface

```typescript
const template = `
{{blockComment description}}
export interface {{PascalCase name}} {
{{#each properties}}
  {{#if description}}{{comment description "//"}}{{/if}}
  {{camelCase name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}
`;

const result = engine.render(template, {
  name: 'user_profile',
  description: 'User profile data',
  properties: [
    { name: 'user_id', type: 'string', required: true, description: 'Unique user identifier' },
    { name: 'email_address', type: 'string', required: true },
    { name: 'display_name', type: 'string', required: false }
  ]
});
```

Output:
```typescript
/*
 * User profile data
 */
export interface UserProfile {
  // Unique user identifier
  userId: string;
  emailAddress: string;
  displayName?: string;
}
```

### Python Class

```typescript
const template = `
{{blockComment description "\"\"\"" "\"\"\""}}
class {{PascalCase name}}:
    def __init__(self{{#each properties}}, {{snake_case name}}: {{type}}{{/each}}):
{{#each properties}}
        self.{{snake_case name}} = {{snake_case name}}
{{/each}}

{{#each methods}}
    def {{snake_case name}}(self{{#each params}}, {{snake_case name}}: {{type}}{{/each}}) -> {{returnType}}:
        {{blockComment description "\"\"\"" "\"\"\""}}
        pass
{{/each}}
`;

const result = engine.render(template, {
  name: 'user_service',
  description: 'Service for managing users',
  properties: [
    { name: 'apiKey', type: 'str' },
    { name: 'baseUrl', type: 'str' }
  ],
  methods: [
    {
      name: 'getUser',
      description: 'Get user by ID',
      params: [{ name: 'userId', type: 'str' }],
      returnType: 'User'
    }
  ]
});
```

### Rust Struct

```typescript
const template = `
{{#if description}}{{blockComment description "///" "///"}}{{/if}}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct {{PascalCase name}} {
{{#each fields}}
    {{#if description}}{{comment description "///"}}{{/if}}
    pub {{snake_case name}}: {{#if optional}}Option<{{type}}>{{else}}{{type}}{{/if}},
{{/each}}
}
`;

const result = engine.render(template, {
  name: 'UserData',
  description: 'User data structure',
  fields: [
    { name: 'userId', type: 'String', optional: false },
    { name: 'email', type: 'String', optional: false },
    { name: 'phoneNumber', type: 'String', optional: true, description: 'Optional phone number' }
  ]
});
```

## Advanced Features

### Custom Helpers

```typescript
// Register a custom helper
engine.registerHelper('titleCase', (str: string) => {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
});

// Use the custom helper
const result = engine.render('{{titleCase text}}', { text: 'hello WORLD' });
// Output: "Hello World"
```

### Partials

```typescript
// Register a partial
engine.registerPartial('header', `
/**
 * {{title}}
 *
 * Auto-generated by LLM-Forge
 */
`);

// Use the partial
const result = engine.render(`
{{> header}}
export class MyClass {}
`, { title: 'My Class' });
```

### Nested Helpers

```typescript
const template = '{{PascalCase (replace name "_" "-")}}';
const result = engine.render(template, { name: 'user_api_client' });
// Output: "User-Api-Client"
```

### Complex Conditionals

```typescript
const template = `
{{#if (and (gt count 0) (eq status "active"))}}
  Active with {{count}} {{pluralize "item" count}}
{{else if (eq status "pending")}}
  Pending
{{else}}
  Inactive
{{/if}}
`;
```

## Performance

The template engine includes several performance optimizations:

- **Template Caching**: Compiled templates are cached by default
- **Lazy Evaluation**: Helpers are only executed when needed
- **Efficient String Operations**: Optimized for common code generation patterns

```typescript
// Benchmark: 1000 items
const template = '{{#each items}}{{PascalCase name}}\n{{/each}}';
const items = Array.from({ length: 1000 }, (_, i) => ({ name: `item_${i}` }));

const start = Date.now();
const result = engine.render(template, { items });
const time = Date.now() - start;
// Typical: < 100ms
```

## Integration with Generators

### Using Templates in Generators

```typescript
import { TemplateEngine } from '@llm-dev-ops/llm-forge';
import { BaseGenerator } from './base-generator';

class MyGenerator extends BaseGenerator {
  private templateEngine: TemplateEngine;

  constructor(schema, options) {
    super(schema, options);
    this.templateEngine = new TemplateEngine();

    // Register generator-specific helpers
    this.templateEngine.registerHelper('mapType', (type) => {
      // Custom type mapping logic
      return this.typeMapper.mapTypeReference(type);
    });
  }

  async generateClient(): Promise<string> {
    const template = `
    export class {{PascalCase clientName}} {
    {{#each endpoints}}
      async {{camelCase operationId}}({{#each parameters}}{{camelCase name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}) {
        {{indent (comment summary "//") 4}}
        return this.request('{{upper method}}', '{{path}}');
      }
    {{/each}}
    }
    `;

    return this.templateEngine.render(template, {
      clientName: this.schema.metadata.providerId,
      endpoints: this.schema.endpoints
    });
  }
}
```

## Error Handling

```typescript
try {
  const result = engine.render(template, context);
  console.log(result.output);

  // Check for warnings
  if (result.warnings.length > 0) {
    console.warn('Template warnings:', result.warnings);
  }
} catch (error) {
  console.error('Template rendering failed:', error.message);
}
```

## Best Practices

1. **Use Caching**: Keep caching enabled for production use
2. **Validate Input**: Ensure context data is valid before rendering
3. **Handle Errors**: Always wrap rendering in try-catch blocks
4. **Test Templates**: Write tests for complex templates
5. **Use Partials**: Extract common patterns into reusable partials
6. **Document Helpers**: Comment custom helpers with examples
7. **Performance**: Profile templates with large datasets
8. **Type Safety**: Use TypeScript types for context data

## TypeScript Types

```typescript
import type {
  TemplateEngine,
  TemplateOptions,
  RenderResult,
  HelperFunction
} from '@llm-dev-ops/llm-forge';

// Define context type
interface TemplateContext {
  name: string;
  items: Array<{ id: string; value: string }>;
}

const engine = new TemplateEngine();
const result: RenderResult = engine.render<TemplateContext>(template, context);
```

## Testing Templates

```typescript
import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '@llm-dev-ops/llm-forge';

describe('MyTemplates', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  it('should generate valid TypeScript interface', () => {
    const result = engine.render(template, context);
    expect(result.output).toContain('export interface');
    expect(result.warnings).toEqual([]);
  });
});
```

## License

Apache-2.0
