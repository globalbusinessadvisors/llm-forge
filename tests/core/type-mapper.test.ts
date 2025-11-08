/**
 * TypeMapper Tests
 * Comprehensive tests for the TypeMapper class
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { TypeMapper, TargetLanguage } from '../../src/core/type-mapper.js';
import {
  TypeKind,
  PrimitiveTypeKind,
  type TypeDefinition,
  type TypeReference,
} from '../../src/types/canonical-schema.js';

describe('TypeMapper', () => {
  describe('Constructor', () => {
    it('should create a TypeMapper with minimal config', () => {
      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript });
      expect(mapper).toBeDefined();
    });

    it('should create a TypeMapper with types', () => {
      const types: TypeDefinition[] = [
        {
          id: 'type_1',
          name: 'User',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.String,
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      expect(mapper).toBeDefined();
    });

    it('should accept custom mappings', () => {
      const mapper = new TypeMapper({
        language: TargetLanguage.TypeScript,
        customMappings: { CustomType: 'MyCustomType' },
      });
      expect(mapper).toBeDefined();
    });

    it('should default useNullable to true', () => {
      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript });
      expect(mapper).toBeDefined();
    });
  });

  describe('Primitive Type Mapping', () => {
    describe('TypeScript', () => {
      let mapper: TypeMapper;
      let types: TypeDefinition[];

      beforeEach(() => {
        types = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'int_type',
            name: 'IntType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Integer,
          },
          {
            id: 'float_type',
            name: 'FloatType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Float,
          },
          {
            id: 'bool_type',
            name: 'BoolType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Boolean,
          },
          {
            id: 'null_type',
            name: 'NullType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Null,
          },
        ];
        mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      });

      it('should map string to string', () => {
        const ref: TypeReference = { typeId: 'string_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('string');
        expect(mapped.imports).toEqual([]);
        expect(mapped.nullable).toBe(false);
      });

      it('should map integer to number', () => {
        const ref: TypeReference = { typeId: 'int_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('number');
      });

      it('should map float to number', () => {
        const ref: TypeReference = { typeId: 'float_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('number');
      });

      it('should map boolean to boolean', () => {
        const ref: TypeReference = { typeId: 'bool_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('boolean');
      });

      it('should map null to null', () => {
        const ref: TypeReference = { typeId: 'null_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('null');
      });
    });

    describe('Python', () => {
      let mapper: TypeMapper;
      let types: TypeDefinition[];

      beforeEach(() => {
        types = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'int_type',
            name: 'IntType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Integer,
          },
          {
            id: 'float_type',
            name: 'FloatType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Float,
          },
          {
            id: 'bool_type',
            name: 'BoolType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Boolean,
          },
        ];
        mapper = new TypeMapper({ language: TargetLanguage.Python }, types);
      });

      it('should map string to str', () => {
        const ref: TypeReference = { typeId: 'string_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('str');
      });

      it('should map integer to int', () => {
        const ref: TypeReference = { typeId: 'int_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('int');
      });

      it('should map float to float', () => {
        const ref: TypeReference = { typeId: 'float_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('float');
      });

      it('should map boolean to bool', () => {
        const ref: TypeReference = { typeId: 'bool_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('bool');
      });
    });

    describe('Rust', () => {
      let mapper: TypeMapper;
      let types: TypeDefinition[];

      beforeEach(() => {
        types = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'int_type',
            name: 'IntType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Integer,
          },
          {
            id: 'float_type',
            name: 'FloatType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Float,
          },
          {
            id: 'bool_type',
            name: 'BoolType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Boolean,
          },
        ];
        mapper = new TypeMapper({ language: TargetLanguage.Rust }, types);
      });

      it('should map string to String', () => {
        const ref: TypeReference = { typeId: 'string_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('String');
      });

      it('should map integer to i64', () => {
        const ref: TypeReference = { typeId: 'int_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('i64');
      });

      it('should map float to f64', () => {
        const ref: TypeReference = { typeId: 'float_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('f64');
      });

      it('should map boolean to bool', () => {
        const ref: TypeReference = { typeId: 'bool_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('bool');
      });
    });

    describe('Go', () => {
      let mapper: TypeMapper;
      let types: TypeDefinition[];

      beforeEach(() => {
        types = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'int_type',
            name: 'IntType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Integer,
          },
          {
            id: 'float_type',
            name: 'FloatType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Float,
          },
          {
            id: 'bool_type',
            name: 'BoolType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Boolean,
          },
        ];
        mapper = new TypeMapper({ language: TargetLanguage.Go }, types);
      });

      it('should map string to string', () => {
        const ref: TypeReference = { typeId: 'string_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('string');
      });

      it('should map integer to int64', () => {
        const ref: TypeReference = { typeId: 'int_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('int64');
      });

      it('should map float to float64', () => {
        const ref: TypeReference = { typeId: 'float_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('float64');
      });

      it('should map boolean to bool', () => {
        const ref: TypeReference = { typeId: 'bool_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('bool');
      });
    });

    describe('C#', () => {
      let mapper: TypeMapper;
      let types: TypeDefinition[];

      beforeEach(() => {
        types = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'int_type',
            name: 'IntType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Integer,
          },
          {
            id: 'float_type',
            name: 'FloatType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Float,
          },
          {
            id: 'bool_type',
            name: 'BoolType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Boolean,
          },
        ];
        mapper = new TypeMapper({ language: TargetLanguage.CSharp }, types);
      });

      it('should map string to string', () => {
        const ref: TypeReference = { typeId: 'string_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('string');
      });

      it('should map integer to long', () => {
        const ref: TypeReference = { typeId: 'int_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('long');
      });

      it('should map float to double', () => {
        const ref: TypeReference = { typeId: 'float_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('double');
      });

      it('should map boolean to bool', () => {
        const ref: TypeReference = { typeId: 'bool_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('bool');
      });
    });

    describe('Java', () => {
      let mapper: TypeMapper;
      let types: TypeDefinition[];

      beforeEach(() => {
        types = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'int_type',
            name: 'IntType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Integer,
          },
          {
            id: 'float_type',
            name: 'FloatType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Float,
          },
          {
            id: 'bool_type',
            name: 'BoolType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.Boolean,
          },
        ];
        mapper = new TypeMapper({ language: TargetLanguage.Java }, types);
      });

      it('should map string to String', () => {
        const ref: TypeReference = { typeId: 'string_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('String');
      });

      it('should map integer to long primitive', () => {
        const ref: TypeReference = { typeId: 'int_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('long');
      });

      it('should map float to double primitive', () => {
        const ref: TypeReference = { typeId: 'float_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('double');
      });

      it('should map boolean to boolean primitive', () => {
        const ref: TypeReference = { typeId: 'bool_type' };
        const mapped = mapper.mapTypeReference(ref);
        expect(mapped.type).toBe('boolean');
      });
    });
  });

  describe('Object Type Mapping', () => {
    it('should map object types with PascalCase conversion', () => {
      const types: TypeDefinition[] = [
        {
          id: 'user_type',
          name: 'user',
          kind: TypeKind.Object,
          properties: [],
          required: [],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'user_type' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('User');
      expect(mapped.imports).toEqual([]);
      expect(mapped.nullable).toBe(false);
    });

    it('should handle snake_case to PascalCase', () => {
      const types: TypeDefinition[] = [
        {
          id: 'chat_message',
          name: 'chat_message',
          kind: TypeKind.Object,
          properties: [],
          required: [],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'chat_message' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('ChatMessage');
    });

    it('should handle kebab-case to PascalCase', () => {
      const types: TypeDefinition[] = [
        {
          id: 'user-profile',
          name: 'user-profile',
          kind: TypeKind.Object,
          properties: [],
          required: [],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'user-profile' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('UserProfile');
    });

    it('should respect custom mappings', () => {
      const types: TypeDefinition[] = [
        {
          id: 'custom_type',
          name: 'custom_type',
          kind: TypeKind.Object,
          properties: [],
          required: [],
        },
      ];

      const mapper = new TypeMapper(
        {
          language: TargetLanguage.TypeScript,
          customMappings: { custom_type: 'MyCustomType' },
        },
        types
      );

      const ref: TypeReference = { typeId: 'custom_type' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('MyCustomType');
    });
  });

  describe('Enum Type Mapping', () => {
    it('should map enum types with PascalCase conversion', () => {
      const types: TypeDefinition[] = [
        {
          id: 'role_enum',
          name: 'role',
          kind: TypeKind.Enum,
          values: [
            { value: 'admin', description: 'Admin role' },
            { value: 'user', description: 'User role' },
          ],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'role_enum' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('Role');
      expect(mapped.imports).toEqual([]);
      expect(mapped.nullable).toBe(false);
    });

    it('should handle snake_case enum names', () => {
      const types: TypeDefinition[] = [
        {
          id: 'finish_reason',
          name: 'finish_reason',
          kind: TypeKind.Enum,
          values: [{ value: 'stop' }, { value: 'length' }],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.Go }, types);
      const ref: TypeReference = { typeId: 'finish_reason' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('FinishReason');
    });
  });

  describe('Array Type Mapping', () => {
    describe('TypeScript arrays', () => {
      it('should map array of primitives', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'string_array',
            name: 'StringArray',
            kind: TypeKind.Array,
            items: { typeId: 'string_type' },
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
        const ref: TypeReference = { typeId: 'string_array' };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('string[]');
        expect(mapped.imports).toEqual([]);
      });

      it('should map array of objects', () => {
        const types: TypeDefinition[] = [
          {
            id: 'user_type',
            name: 'user',
            kind: TypeKind.Object,
            properties: [],
            required: [],
          },
          {
            id: 'user_array',
            name: 'UserArray',
            kind: TypeKind.Array,
            items: { typeId: 'user_type' },
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
        const ref: TypeReference = { typeId: 'user_array' };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('User[]');
      });
    });

    describe('Python arrays', () => {
      it('should map array with List import', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'string_array',
            name: 'StringArray',
            kind: TypeKind.Array,
            items: { typeId: 'string_type' },
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.Python }, types);
        const ref: TypeReference = { typeId: 'string_array' };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('List[str]');
        expect(mapped.imports).toContain('from typing import List');
      });
    });

    describe('Rust arrays', () => {
      it('should map array as Vec', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'string_array',
            name: 'StringArray',
            kind: TypeKind.Array,
            items: { typeId: 'string_type' },
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.Rust }, types);
        const ref: TypeReference = { typeId: 'string_array' };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('Vec<String>');
      });
    });

    describe('Go arrays', () => {
      it('should map array as slice', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'string_array',
            name: 'StringArray',
            kind: TypeKind.Array,
            items: { typeId: 'string_type' },
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.Go }, types);
        const ref: TypeReference = { typeId: 'string_array' };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('[]string');
      });
    });

    describe('C# arrays', () => {
      it('should map array as List with import', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'string_array',
            name: 'StringArray',
            kind: TypeKind.Array,
            items: { typeId: 'string_type' },
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.CSharp }, types);
        const ref: TypeReference = { typeId: 'string_array' };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('List<string>');
        expect(mapped.imports).toContain('using System.Collections.Generic;');
      });
    });

    describe('Java arrays', () => {
      it('should map array as List with import', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
          {
            id: 'string_array',
            name: 'StringArray',
            kind: TypeKind.Array,
            items: { typeId: 'string_type' },
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.Java }, types);
        const ref: TypeReference = { typeId: 'string_array' };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('List<String>');
        expect(mapped.imports).toContain('import java.util.List;');
      });
    });
  });

  describe('Nullable Type Handling', () => {
    describe('TypeScript nullable', () => {
      it('should make types nullable with undefined', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
        const ref: TypeReference = { typeId: 'string_type', nullable: true };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('string | undefined');
        expect(mapped.nullable).toBe(true);
      });
    });

    describe('Python nullable', () => {
      it('should make types Optional', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.Python }, types);
        const ref: TypeReference = { typeId: 'string_type', nullable: true };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('Optional[str]');
        expect(mapped.imports).toContain('from typing import Optional');
      });
    });

    describe('Rust nullable', () => {
      it('should make types Option', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.Rust }, types);
        const ref: TypeReference = { typeId: 'string_type', nullable: true };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('Option<String>');
      });
    });

    describe('Go nullable', () => {
      it('should make types pointers', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.Go }, types);
        const ref: TypeReference = { typeId: 'string_type', nullable: true };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('*string');
      });
    });

    describe('C# nullable', () => {
      it('should make types nullable with ?', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.CSharp }, types);
        const ref: TypeReference = { typeId: 'string_type', nullable: true };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('string?');
      });
    });

    describe('Java nullable', () => {
      it('should make types Optional', () => {
        const types: TypeDefinition[] = [
          {
            id: 'string_type',
            name: 'StringType',
            kind: TypeKind.Primitive,
            primitiveKind: PrimitiveTypeKind.String,
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.Java }, types);
        const ref: TypeReference = { typeId: 'string_type', nullable: true };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe('Optional<String>');
        expect(mapped.imports).toContain('import java.util.Optional;');
      });
    });

    it('should respect useNullable config option', () => {
      const types: TypeDefinition[] = [
        {
          id: 'string_type',
          name: 'StringType',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.String,
        },
      ];

      const mapper = new TypeMapper(
        { language: TargetLanguage.TypeScript, useNullable: false },
        types
      );
      const ref: TypeReference = { typeId: 'string_type', nullable: true };
      const mapped = mapper.mapTypeReference(ref);

      // Should not apply nullable wrapper when useNullable is false
      expect(mapped.type).toBe('string');
    });
  });

  describe('Union Type Mapping', () => {
    it('should map union types for TypeScript', () => {
      const types: TypeDefinition[] = [
        {
          id: 'string_type',
          name: 'StringType',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.String,
        },
        {
          id: 'int_type',
          name: 'IntType',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.Integer,
        },
        {
          id: 'union_type',
          name: 'UnionType',
          kind: TypeKind.Union,
          variants: [{ typeId: 'string_type' }, { typeId: 'int_type' }],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'union_type' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('string | number');
    });

    it('should map union types for Rust as enum name', () => {
      const types: TypeDefinition[] = [
        {
          id: 'string_type',
          name: 'StringType',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.String,
        },
        {
          id: 'int_type',
          name: 'IntType',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.Integer,
        },
        {
          id: 'union_type',
          name: 'value',
          kind: TypeKind.Union,
          variants: [{ typeId: 'string_type' }, { typeId: 'int_type' }],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.Rust }, types);
      const ref: TypeReference = { typeId: 'union_type' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('Value');
    });
  });

  describe('Type Registry Operations', () => {
    it('should add types to registry', () => {
      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript });

      const types: TypeDefinition[] = [
        {
          id: 'new_type',
          name: 'NewType',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.String,
        },
      ];

      mapper.addTypes(types);

      const ref: TypeReference = { typeId: 'new_type' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('string');
    });

    it('should handle multiple calls to addTypes', () => {
      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript });

      mapper.addTypes([
        {
          id: 'type_1',
          name: 'Type1',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.String,
        },
      ]);

      mapper.addTypes([
        {
          id: 'type_2',
          name: 'Type2',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.Integer,
        },
      ]);

      expect(mapper.mapTypeReference({ typeId: 'type_1' }).type).toBe('string');
      expect(mapper.mapTypeReference({ typeId: 'type_2' }).type).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent type reference', () => {
      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript });

      const ref: TypeReference = { typeId: 'nonexistent_type' };

      expect(() => mapper.mapTypeReference(ref)).toThrow('Type not found: nonexistent_type');
    });

    it('should throw error for array without items', () => {
      const types: TypeDefinition[] = [
        {
          id: 'bad_array',
          name: 'BadArray',
          kind: TypeKind.Array,
          items: { typeId: 'nonexistent' },
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'bad_array' };

      expect(() => mapper.mapTypeReference(ref)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object type', () => {
      const types: TypeDefinition[] = [
        {
          id: 'empty_obj',
          name: 'empty_object',
          kind: TypeKind.Object,
          properties: [],
          required: [],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'empty_obj' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('EmptyObject');
    });

    it('should handle enum with empty values array', () => {
      const types: TypeDefinition[] = [
        {
          id: 'empty_enum',
          name: 'empty_enum',
          kind: TypeKind.Enum,
          values: [],
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'empty_enum' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('EmptyEnum');
    });

    it('should handle complex nested arrays', () => {
      const types: TypeDefinition[] = [
        {
          id: 'string_type',
          name: 'StringType',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.String,
        },
        {
          id: 'string_array',
          name: 'StringArray',
          kind: TypeKind.Array,
          items: { typeId: 'string_type' },
        },
        {
          id: 'nested_array',
          name: 'NestedArray',
          kind: TypeKind.Array,
          items: { typeId: 'string_array' },
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'nested_array' };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('string[][]');
    });

    it('should handle nullable arrays', () => {
      const types: TypeDefinition[] = [
        {
          id: 'string_type',
          name: 'StringType',
          kind: TypeKind.Primitive,
          primitiveKind: PrimitiveTypeKind.String,
        },
        {
          id: 'string_array',
          name: 'StringArray',
          kind: TypeKind.Array,
          items: { typeId: 'string_type' },
        },
      ];

      const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
      const ref: TypeReference = { typeId: 'string_array', nullable: true };
      const mapped = mapper.mapTypeReference(ref);

      expect(mapped.type).toBe('string[] | undefined');
    });
  });

  describe('PascalCase Conversion', () => {
    it('should handle various case formats', () => {
      const testCases = [
        { name: 'lowercase', expected: 'Lowercase' },
        { name: 'UPPERCASE', expected: 'UPPERCASE' },
        { name: 'camelCase', expected: 'CamelCase' },
        { name: 'PascalCase', expected: 'PascalCase' },
        { name: 'snake_case', expected: 'SnakeCase' },
        { name: 'kebab-case', expected: 'KebabCase' },
        { name: 'mixed_case-format', expected: 'MixedCaseFormat' },
      ];

      testCases.forEach(({ name, expected }) => {
        const types: TypeDefinition[] = [
          {
            id: 'test_type',
            name: name,
            kind: TypeKind.Object,
            properties: [],
            required: [],
          },
        ];

        const mapper = new TypeMapper({ language: TargetLanguage.TypeScript }, types);
        const ref: TypeReference = { typeId: 'test_type' };
        const mapped = mapper.mapTypeReference(ref);

        expect(mapped.type).toBe(expected);
      });
    });
  });
});
