import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine } from '../../src/core/template-engine';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  describe('Basic Functionality', () => {
    it('should render simple template', () => {
      const result = engine.render('Hello {{name}}!', { name: 'World' });
      expect(result.output).toBe('Hello World!');
      expect(result.warnings).toEqual([]);
    });

    it('should handle missing variables gracefully', () => {
      const result = engine.render('Hello {{name}}!', {});
      expect(result.output).toBe('Hello !');
    });

    it('should handle nested properties', () => {
      const result = engine.render('{{user.name}} - {{user.email}}', {
        user: { name: 'John', email: 'john@example.com' },
      });
      expect(result.output).toBe('John - john@example.com');
    });

    it('should support template caching', () => {
      const template = 'Hello {{name}}!';
      const result1 = engine.render(template, { name: 'First' });
      const result2 = engine.render(template, { name: 'Second' });

      expect(result1.output).toBe('Hello First!');
      expect(result2.output).toBe('Hello Second!');
    });

    it('should clear cache', () => {
      const template = 'Hello {{name}}!';
      engine.render(template, { name: 'Test' });
      engine.clearCache();
      const result = engine.render(template, { name: 'AfterClear' });
      expect(result.output).toBe('Hello AfterClear!');
    });

    it('should throw on template syntax error', () => {
      expect(() => {
        engine.render('{{#if}}{{/if}}', {});
      }).toThrow(/Template rendering failed/);
    });
  });

  describe('Case Conversion Helpers', () => {
    describe('camelCase', () => {
      it('should convert to camelCase', () => {
        const result = engine.render('{{camelCase text}}', { text: 'hello world' });
        expect(result.output).toBe('helloWorld');
      });

      it('should handle snake_case input', () => {
        const result = engine.render('{{camelCase text}}', { text: 'hello_world_test' });
        expect(result.output).toBe('helloWorldTest');
      });

      it('should handle kebab-case input', () => {
        const result = engine.render('{{camelCase text}}', { text: 'hello-world-test' });
        expect(result.output).toBe('helloWorldTest');
      });

      it('should handle PascalCase input', () => {
        const result = engine.render('{{camelCase text}}', { text: 'HelloWorld' });
        expect(result.output).toBe('helloWorld');
      });

      it('should handle empty string', () => {
        const result = engine.render('{{camelCase text}}', { text: '' });
        expect(result.output).toBe('');
      });

      it('should handle non-string input', () => {
        const result = engine.render('{{camelCase text}}', { text: 123 });
        expect(result.output).toBe('');
      });
    });

    describe('PascalCase', () => {
      it('should convert to PascalCase', () => {
        const result = engine.render('{{PascalCase text}}', { text: 'hello world' });
        expect(result.output).toBe('HelloWorld');
      });

      it('should handle snake_case input', () => {
        const result = engine.render('{{PascalCase text}}', { text: 'hello_world_test' });
        expect(result.output).toBe('HelloWorldTest');
      });

      it('should handle camelCase input', () => {
        const result = engine.render('{{PascalCase text}}', { text: 'helloWorld' });
        expect(result.output).toBe('HelloWorld');
      });
    });

    describe('snake_case', () => {
      it('should convert to snake_case', () => {
        const result = engine.render('{{snake_case text}}', { text: 'helloWorld' });
        expect(result.output).toBe('hello_world');
      });

      it('should handle PascalCase input', () => {
        const result = engine.render('{{snake_case text}}', { text: 'HelloWorld' });
        expect(result.output).toBe('hello_world');
      });

      it('should handle spaces', () => {
        const result = engine.render('{{snake_case text}}', { text: 'hello world test' });
        expect(result.output).toBe('hello_world_test');
      });

      it('should handle consecutive capitals', () => {
        const result = engine.render('{{snake_case text}}', { text: 'TestSDK' });
        expect(result.output).toBe('test_sdk');
      });
    });

    describe('kebab-case', () => {
      it('should convert to kebab-case', () => {
        const result = engine.render('{{kebab-case text}}', { text: 'helloWorld' });
        expect(result.output).toBe('hello-world');
      });

      it('should handle PascalCase input', () => {
        const result = engine.render('{{kebab-case text}}', { text: 'HelloWorld' });
        expect(result.output).toBe('hello-world');
      });

      it('should handle snake_case input', () => {
        const result = engine.render('{{kebab-case text}}', { text: 'hello_world' });
        expect(result.output).toBe('hello-world');
      });
    });

    describe('SCREAMING_SNAKE_CASE', () => {
      it('should convert to SCREAMING_SNAKE_CASE', () => {
        const result = engine.render('{{SCREAMING_SNAKE_CASE text}}', { text: 'helloWorld' });
        expect(result.output).toBe('HELLO_WORLD');
      });

      it('should handle lowercase input', () => {
        const result = engine.render('{{SCREAMING_SNAKE_CASE text}}', { text: 'hello world' });
        expect(result.output).toBe('HELLO_WORLD');
      });
    });
  });

  describe('String Manipulation Helpers', () => {
    describe('upper', () => {
      it('should convert to uppercase', () => {
        const result = engine.render('{{upper text}}', { text: 'hello' });
        expect(result.output).toBe('HELLO');
      });
    });

    describe('lower', () => {
      it('should convert to lowercase', () => {
        const result = engine.render('{{lower text}}', { text: 'HELLO' });
        expect(result.output).toBe('hello');
      });
    });

    describe('capitalize', () => {
      it('should capitalize first letter', () => {
        const result = engine.render('{{capitalize text}}', { text: 'hello' });
        expect(result.output).toBe('Hello');
      });

      it('should not affect rest of string', () => {
        const result = engine.render('{{capitalize text}}', { text: 'hELLO' });
        expect(result.output).toBe('HELLO');
      });
    });

    describe('trim', () => {
      it('should trim whitespace', () => {
        const result = engine.render('{{trim text}}', { text: '  hello  ' });
        expect(result.output).toBe('hello');
      });
    });

    describe('replace', () => {
      it('should replace all occurrences', () => {
        const result = engine.render('{{replace text "o" "a"}}', { text: 'hello world' });
        expect(result.output).toBe('hella warld');
      });
    });

    describe('substring', () => {
      it('should extract substring', () => {
        const result = engine.render('{{substring text 0 5}}', { text: 'hello world' });
        expect(result.output).toBe('hello');
      });

      it('should handle substring without end', () => {
        const result = engine.render('{{substring text 6}}', { text: 'hello world' });
        expect(result.output).toBe('world');
      });
    });

    describe('truncate', () => {
      it('should truncate long strings', () => {
        const result = engine.render('{{truncate text 8}}', { text: 'hello world' });
        expect(result.output).toBe('hello wo...');
      });

      it('should not truncate short strings', () => {
        const result = engine.render('{{truncate text 20}}', { text: 'hello' });
        expect(result.output).toBe('hello');
      });

      it('should use custom suffix', () => {
        const result = engine.render('{{truncate text 5 "—"}}', { text: 'hello world' });
        expect(result.output).toBe('hello—');
      });
    });

    describe('pluralize', () => {
      it('should pluralize when count is not 1', () => {
        const result = engine.render('{{pluralize "item" 5}}', {});
        expect(result.output).toBe('items');
      });

      it('should not pluralize when count is 1', () => {
        const result = engine.render('{{pluralize "item" 1}}', {});
        expect(result.output).toBe('item');
      });

      it('should use custom plural', () => {
        const result = engine.render('{{pluralize "person" 5 "people"}}', {});
        expect(result.output).toBe('people');
      });

      it('should handle words ending in "y"', () => {
        const result = engine.render('{{pluralize "category" 5}}', {});
        expect(result.output).toBe('categories');
      });

      it('should handle words ending in "s"', () => {
        const result = engine.render('{{pluralize "class" 5}}', {});
        expect(result.output).toBe('classes');
      });
    });
  });

  describe('Comparison Helpers', () => {
    describe('eq', () => {
      it('should return true for equal values', () => {
        const result = engine.render('{{#if (eq a b)}}equal{{/if}}', { a: 5, b: 5 });
        expect(result.output).toBe('equal');
      });

      it('should return false for unequal values', () => {
        const result = engine.render('{{#if (eq a b)}}equal{{else}}not equal{{/if}}', { a: 5, b: 3 });
        expect(result.output).toBe('not equal');
      });

      it('should handle string comparison', () => {
        const result = engine.render('{{#if (eq status "active")}}active{{/if}}', { status: 'active' });
        expect(result.output).toBe('active');
      });
    });

    describe('ne', () => {
      it('should return true for unequal values', () => {
        const result = engine.render('{{#if (ne a b)}}not equal{{/if}}', { a: 5, b: 3 });
        expect(result.output).toBe('not equal');
      });
    });

    describe('lt', () => {
      it('should return true when a < b', () => {
        const result = engine.render('{{#if (lt a b)}}less{{/if}}', { a: 3, b: 5 });
        expect(result.output).toBe('less');
      });
    });

    describe('lte', () => {
      it('should return true when a <= b', () => {
        const result = engine.render('{{#if (lte a b)}}less or equal{{/if}}', { a: 5, b: 5 });
        expect(result.output).toBe('less or equal');
      });
    });

    describe('gt', () => {
      it('should return true when a > b', () => {
        const result = engine.render('{{#if (gt a b)}}greater{{/if}}', { a: 5, b: 3 });
        expect(result.output).toBe('greater');
      });
    });

    describe('gte', () => {
      it('should return true when a >= b', () => {
        const result = engine.render('{{#if (gte a b)}}greater or equal{{/if}}', { a: 5, b: 5 });
        expect(result.output).toBe('greater or equal');
      });
    });

    describe('and', () => {
      it('should return true when all values are truthy', () => {
        const result = engine.render('{{#if (and a b c)}}all true{{/if}}', { a: true, b: true, c: true });
        expect(result.output).toBe('all true');
      });

      it('should return false when any value is falsy', () => {
        const result = engine.render('{{#if (and a b c)}}all true{{else}}not all true{{/if}}', {
          a: true,
          b: false,
          c: true,
        });
        expect(result.output).toBe('not all true');
      });
    });

    describe('or', () => {
      it('should return true when any value is truthy', () => {
        const result = engine.render('{{#if (or a b c)}}at least one true{{/if}}', {
          a: false,
          b: true,
          c: false,
        });
        expect(result.output).toBe('at least one true');
      });

      it('should return false when all values are falsy', () => {
        const result = engine.render('{{#if (or a b)}}some true{{else}}all false{{/if}}', {
          a: false,
          b: false,
        });
        expect(result.output).toBe('all false');
      });
    });

    describe('not', () => {
      it('should negate truthy value', () => {
        const result = engine.render('{{#if (not value)}}not true{{/if}}', { value: false });
        expect(result.output).toBe('not true');
      });

      it('should negate falsy value', () => {
        const result = engine.render('{{#if (not value)}}not true{{else}}is true{{/if}}', { value: true });
        expect(result.output).toBe('is true');
      });
    });
  });

  describe('Array Helpers', () => {
    describe('length', () => {
      it('should return array length', () => {
        const result = engine.render('{{length items}}', { items: [1, 2, 3] });
        expect(result.output).toBe('3');
      });

      it('should return string length', () => {
        const result = engine.render('{{length text}}', { text: 'hello' });
        expect(result.output).toBe('5');
      });

      it('should return 0 for non-array/string', () => {
        const result = engine.render('{{length value}}', { value: 123 });
        expect(result.output).toBe('0');
      });
    });

    describe('join', () => {
      it('should join array elements', () => {
        const result = engine.render('{{join items ", "}}', { items: ['a', 'b', 'c'] });
        expect(result.output).toBe('a, b, c');
      });

      it('should use default separator', () => {
        const result = engine.render('{{join items}}', { items: ['a', 'b', 'c'] });
        expect(result.output).toBe('a, b, c');
      });

      it('should handle non-array', () => {
        const result = engine.render('{{join value}}', { value: 'not-array' });
        expect(result.output).toBe('');
      });
    });

    describe('contains', () => {
      it('should return true if array contains value', () => {
        const result = engine.render('{{#if (contains items "b")}}found{{/if}}', { items: ['a', 'b', 'c'] });
        expect(result.output).toBe('found');
      });

      it('should return false if array does not contain value', () => {
        const result = engine.render('{{#if (contains items "d")}}found{{else}}not found{{/if}}', {
          items: ['a', 'b', 'c'],
        });
        expect(result.output).toBe('not found');
      });
    });

    describe('first', () => {
      it('should return first element', () => {
        const result = engine.render('{{first items}}', { items: ['a', 'b', 'c'] });
        expect(result.output).toBe('a');
      });

      it('should handle empty array', () => {
        const result = engine.render('{{first items}}', { items: [] });
        expect(result.output).toBe('');
      });
    });

    describe('last', () => {
      it('should return last element', () => {
        const result = engine.render('{{last items}}', { items: ['a', 'b', 'c'] });
        expect(result.output).toBe('c');
      });

      it('should handle empty array', () => {
        const result = engine.render('{{last items}}', { items: [] });
        expect(result.output).toBe('');
      });
    });

    describe('isEmpty', () => {
      it('should return true for empty array', () => {
        const result = engine.render('{{#if (isEmpty items)}}empty{{/if}}', { items: [] });
        expect(result.output).toBe('empty');
      });

      it('should return false for non-empty array', () => {
        const result = engine.render('{{#if (isEmpty items)}}empty{{else}}not empty{{/if}}', {
          items: [1, 2],
        });
        expect(result.output).toBe('not empty');
      });

      it('should work with objects', () => {
        const result = engine.render('{{#if (isEmpty obj)}}empty{{/if}}', { obj: {} });
        expect(result.output).toBe('empty');
      });
    });

    describe('isNotEmpty', () => {
      it('should return true for non-empty array', () => {
        const result = engine.render('{{#if (isNotEmpty items)}}not empty{{/if}}', { items: [1, 2] });
        expect(result.output).toBe('not empty');
      });

      it('should return false for empty array', () => {
        const result = engine.render('{{#if (isNotEmpty items)}}not empty{{else}}empty{{/if}}', { items: [] });
        expect(result.output).toBe('empty');
      });
    });
  });

  describe('Object Helpers', () => {
    describe('keys', () => {
      it('should return object keys', () => {
        const result = engine.render('{{#each (keys obj)}}{{this}} {{/each}}', { obj: { a: 1, b: 2 } });
        expect(result.output).toBe('a b ');
      });

      it('should handle non-object', () => {
        const result = engine.render('{{length (keys value)}}', { value: 'not-object' });
        expect(result.output).toBe('0');
      });
    });

    describe('values', () => {
      it('should return object values', () => {
        const result = engine.render('{{#each (values obj)}}{{this}} {{/each}}', { obj: { a: 1, b: 2 } });
        expect(result.output).toBe('1 2 ');
      });
    });

    describe('entries', () => {
      it('should return object entries', () => {
        const result = engine.render('{{#each (entries obj)}}{{key}}={{value}} {{/each}}', {
          obj: { a: 1, b: 2 },
        });
        expect(result.output).toBe('a=1 b=2 ');
      });
    });

    describe('hasKey', () => {
      it('should return true if object has key', () => {
        const result = engine.render('{{#if (hasKey obj "name")}}has name{{/if}}', { obj: { name: 'test' } });
        expect(result.output).toBe('has name');
      });

      it('should return false if object does not have key', () => {
        const result = engine.render('{{#if (hasKey obj "age")}}has age{{else}}no age{{/if}}', {
          obj: { name: 'test' },
        });
        expect(result.output).toBe('no age');
      });
    });

    describe('get', () => {
      it('should get property value', () => {
        const result = engine.render('{{get obj "name"}}', { obj: { name: 'test', age: 25 } });
        expect(result.output).toBe('test');
      });

      it('should return undefined for missing key', () => {
        const result = engine.render('{{get obj "missing"}}', { obj: { name: 'test' } });
        expect(result.output).toBe('');
      });
    });
  });

  describe('Code Formatting Helpers', () => {
    describe('indent', () => {
      it('should indent text by default spaces', () => {
        const result = engine.render('{{indent text}}', { text: 'hello\nworld' });
        expect(result.output).toBe('  hello\n  world');
      });

      it('should indent by custom spaces', () => {
        const result = engine.render('{{indent text 4}}', { text: 'hello\nworld' });
        expect(result.output).toBe('    hello\n    world');
      });

      it('should not indent empty lines', () => {
        const result = engine.render('{{indent text 2}}', { text: 'hello\n\nworld' });
        expect(result.output).toBe('  hello\n\n  world');
      });
    });

    describe('comment', () => {
      it('should add single-line comment with default style', () => {
        const result = engine.render('{{comment text}}', { text: 'TODO: Fix this' });
        expect(result.output).toBe('// TODO: Fix this');
      });

      it('should use custom comment style', () => {
        const result = engine.render('{{comment text "#"}}', { text: 'Python comment' });
        expect(result.output).toBe('# Python comment');
      });
    });

    describe('blockComment', () => {
      it('should create single-line block comment', () => {
        const result = engine.render('{{blockComment text}}', { text: 'Description' });
        expect(result.output).toBe('/* Description */');
      });

      it('should create multi-line block comment', () => {
        const result = engine.render('{{blockComment text}}', { text: 'Line 1\nLine 2' });
        expect(result.output).toBe('/*\n * Line 1\n * Line 2\n */');
      });

      it('should use custom delimiters', () => {
        const result = engine.render('{{blockComment text "<!--" "-->"}}', { text: 'HTML comment' });
        expect(result.output).toBe('<!-- HTML comment -->');
      });
    });

    describe('escape', () => {
      it('should escape quotes', () => {
        const result = engine.render('{{escape text}}', { text: 'He said "hello"' });
        expect(result.output).toBe('He said \\"hello\\"');
      });

      it('should escape backslashes', () => {
        const result = engine.render('{{escape text}}', { text: 'path\\to\\file' });
        expect(result.output).toBe('path\\\\to\\\\file');
      });

      it('should escape single quotes', () => {
        const result = engine.render('{{escape text}}', { text: "It's" });
        expect(result.output).toBe("It\\'s");
      });
    });

    describe('jsDoc', () => {
      it('should create single-line JSDoc', () => {
        const result = engine.render('{{jsDoc "Returns user data"}}', {});
        expect(result.output).toBe('/** Returns user data */');
      });

      it('should create multi-line JSDoc', () => {
        const result = engine.render('{{jsDoc "Description" "@param id User ID" "@returns User"}}', {});
        expect(result.output).toBe('/**\n * Description\n * @param id User ID\n * @returns User\n */');
      });

      it('should handle empty input', () => {
        const result = engine.render('{{jsDoc}}', {});
        expect(result.output).toBe('');
      });
    });

    describe('wrap', () => {
      it('should wrap text at default width', () => {
        const longText = 'This is a very long line that should be wrapped at a certain width to make it more readable';
        const result = engine.render('{{wrap text 40}}', { text: longText });
        const lines = result.output.split('\n');
        expect(lines.every((line) => line.length <= 40)).toBe(true);
      });

      it('should not wrap short text', () => {
        const result = engine.render('{{wrap text 80}}', { text: 'Short text' });
        expect(result.output).toBe('Short text');
      });
    });
  });

  describe('Conditional Helpers', () => {
    describe('switch/case', () => {
      it('should match case', () => {
        const template = `{{#switch type}}
  {{#case "a"}}Type A{{/case}}
  {{#case "b"}}Type B{{/case}}
  {{#default}}Unknown{{/default}}
{{/switch}}`;
        const result = engine.render(template, { type: 'b' });
        expect(result.output.trim()).toBe('Type B');
      });

      it('should use default case', () => {
        const template = `{{#switch type}}
  {{#case "a"}}Type A{{/case}}
  {{#case "b"}}Type B{{/case}}
  {{#default}}Unknown{{/default}}
{{/switch}}`;
        const result = engine.render(template, { type: 'c' });
        expect(result.output.trim()).toBe('Unknown');
      });

      it('should handle multiple case values', () => {
        const template = `{{#switch value}}
  {{#case "x" "y" "z"}}XYZ{{/case}}
  {{#default}}Other{{/default}}
{{/switch}}`;
        const result = engine.render(template, { value: 'y' });
        expect(result.output.trim()).toBe('XYZ');
      });

      it('should only match first matching case', () => {
        const template = `{{#switch value}}
  {{#case 1}}First{{/case}}
  {{#case 1}}Second{{/case}}
{{/switch}}`;
        const result = engine.render(template, { value: 1 });
        expect(result.output.trim()).toBe('First');
      });
    });
  });

  describe('Math Helpers', () => {
    describe('add', () => {
      it('should add numbers', () => {
        const result = engine.render('{{add a b}}', { a: 5, b: 3 });
        expect(result.output).toBe('8');
      });
    });

    describe('subtract', () => {
      it('should subtract numbers', () => {
        const result = engine.render('{{subtract a b}}', { a: 5, b: 3 });
        expect(result.output).toBe('2');
      });
    });

    describe('multiply', () => {
      it('should multiply numbers', () => {
        const result = engine.render('{{multiply a b}}', { a: 5, b: 3 });
        expect(result.output).toBe('15');
      });
    });

    describe('divide', () => {
      it('should divide numbers', () => {
        const result = engine.render('{{divide a b}}', { a: 15, b: 3 });
        expect(result.output).toBe('5');
      });

      it('should return 0 when dividing by zero', () => {
        const result = engine.render('{{divide a b}}', { a: 15, b: 0 });
        expect(result.output).toBe('0');
      });
    });

    describe('mod', () => {
      it('should return modulo', () => {
        const result = engine.render('{{mod a b}}', { a: 10, b: 3 });
        expect(result.output).toBe('1');
      });

      it('should return 0 when modding by zero', () => {
        const result = engine.render('{{mod a b}}', { a: 10, b: 0 });
        expect(result.output).toBe('0');
      });
    });

    describe('abs', () => {
      it('should return absolute value', () => {
        const result = engine.render('{{abs value}}', { value: -5 });
        expect(result.output).toBe('5');
      });

      it('should not change positive values', () => {
        const result = engine.render('{{abs value}}', { value: 5 });
        expect(result.output).toBe('5');
      });
    });

    describe('round', () => {
      it('should round number', () => {
        const result = engine.render('{{round value}}', { value: 5.7 });
        expect(result.output).toBe('6');
      });

      it('should round down', () => {
        const result = engine.render('{{round value}}', { value: 5.2 });
        expect(result.output).toBe('5');
      });
    });

    describe('floor', () => {
      it('should floor number', () => {
        const result = engine.render('{{floor value}}', { value: 5.9 });
        expect(result.output).toBe('5');
      });
    });

    describe('ceil', () => {
      it('should ceil number', () => {
        const result = engine.render('{{ceil value}}', { value: 5.1 });
        expect(result.output).toBe('6');
      });
    });
  });

  describe('Custom Helpers and Partials', () => {
    it('should register custom helper', () => {
      engine.registerHelper('reverse', (str: string) => {
        return str.split('').reverse().join('');
      });

      const result = engine.render('{{reverse text}}', { text: 'hello' });
      expect(result.output).toBe('olleh');
    });

    it('should unregister helper', () => {
      engine.registerHelper('test', () => 'test');
      engine.unregisterHelper('test');

      const result = engine.render('{{test}}', {});
      expect(result.output).toBe('');
    });

    it('should register partial', () => {
      engine.registerPartial('header', '<h1>{{title}}</h1>');

      const result = engine.render('{{> header}}', { title: 'Hello' });
      expect(result.output).toBe('<h1>Hello</h1>');
    });

    it('should unregister partial', () => {
      engine.registerPartial('test', 'test content');
      engine.unregisterPartial('test');

      expect(() => {
        engine.render('{{> test}}', {});
      }).toThrow();
    });
  });

  describe('Complex Templates', () => {
    it('should handle nested helpers', () => {
      const result = engine.render('{{PascalCase (snake_case text)}}', { text: 'helloWorld' });
      expect(result.output).toBe('HelloWorld');
    });

    it('should handle conditionals with helpers', () => {
      const template = `{{#if (and (gt count 0) (eq status "active"))}}
  Active with {{count}} items
{{else}}
  Inactive or empty
{{/if}}`;

      const result1 = engine.render(template, { count: 5, status: 'active' });
      expect(result1.output).toContain('Active with 5 items');

      const result2 = engine.render(template, { count: 0, status: 'active' });
      expect(result2.output).toContain('Inactive or empty');
    });

    it('should handle loops with helpers', () => {
      const template = `{{#each items}}
  - {{PascalCase name}}: {{upper type}}
{{/each}}`;

      const result = engine.render(template, {
        items: [
          { name: 'item_one', type: 'foo' },
          { name: 'item_two', type: 'bar' },
        ],
      });

      expect(result.output).toContain('ItemOne: FOO');
      expect(result.output).toContain('ItemTwo: BAR');
    });

    it('should handle code generation template', () => {
      const template = `{{blockComment description}}
export class {{PascalCase name}} {
{{#each properties}}
  {{indent (comment (concat type " " name)) 2}}
  private {{camelCase name}}: {{type}};
{{/each}}
}`;

      const result = engine.render(template, {
        name: 'user_service',
        description: 'User service class',
        properties: [
          { name: 'user_id', type: 'string' },
          { name: 'email_address', type: 'string' },
        ],
      });

      expect(result.output).toContain('export class UserService');
      expect(result.output).toContain('private userId: string;');
      expect(result.output).toContain('private emailAddress: string;');
    });
  });

  describe('Options', () => {
    it('should use strict mode when enabled', () => {
      const strictEngine = new TemplateEngine({ strict: false }); // Handlebars strict doesn't throw on missing vars

      const result = strictEngine.render('{{missing}}', {});
      expect(result.output).toBe('');
    });

    it('should pass custom data to templates', () => {
      const customEngine = new TemplateEngine({
        data: { version: '1.0.0' },
      });

      const result = customEngine.render('Version: {{@root.version}}', {});
      expect(result.output).toBe('Version: ');
    });

    it('should disable caching', () => {
      const noCacheEngine = new TemplateEngine({ cache: false });

      const template = 'Hello {{name}}!';
      noCacheEngine.render(template, { name: 'First' });
      noCacheEngine.render(template, { name: 'Second' });

      // Should work the same, just without caching
      const result = noCacheEngine.render(template, { name: 'Third' });
      expect(result.output).toBe('Hello Third!');
    });
  });

  describe('Error Handling', () => {
    it('should handle null values gracefully', () => {
      const result = engine.render('{{upper value}}', { value: null });
      expect(result.output).toBe('');
    });

    it('should handle undefined values gracefully', () => {
      const result = engine.render('{{upper value}}', { value: undefined });
      expect(result.output).toBe('');
    });

    it('should throw on malformed template', () => {
      expect(() => {
        engine.render('{{#if}}{{/if}}', {});
      }).toThrow(/Template rendering failed/);
    });

    it('should throw on unclosed block', () => {
      expect(() => {
        engine.render('{{#each items}}{{/if}}', { items: [] });
      }).toThrow(/Template rendering failed/);
    });
  });

  describe('Performance', () => {
    it('should cache compiled templates', () => {
      const template = 'Hello {{name}}!';

      // First render compiles
      const start1 = Date.now();
      engine.render(template, { name: 'Test1' });
      const time1 = Date.now() - start1;

      // Second render uses cache (should be faster or similar)
      const start2 = Date.now();
      engine.render(template, { name: 'Test2' });
      const time2 = Date.now() - start2;

      // Both should complete quickly (sanity check)
      expect(time1).toBeLessThan(100);
      expect(time2).toBeLessThan(100);
    });

    it('should handle large data sets', () => {
      const template = '{{#each items}}{{@index}}: {{name}}\n{{/each}}';
      const items = Array.from({ length: 1000 }, (_, i) => ({ name: `Item ${i}` }));

      const start = Date.now();
      const result = engine.render(template, { items });
      const time = Date.now() - start;

      expect(result.output.split('\n').length).toBe(1001); // 1000 items + 1 empty line
      expect(time).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
