/**
 * Type Mapper
 *
 * Maps canonical schema types to language-specific type representations.
 * This is the core of cross-language type safety in LLM-Forge.
 *
 * @module core/type-mapper
 */

import type { TypeDefinition, TypeReference } from '../types/canonical-schema.js';
import { PrimitiveTypeKind, TypeKind } from '../types/canonical-schema.js';

/**
 * Supported target languages
 */
export enum TargetLanguage {
  Rust = 'rust',
  TypeScript = 'typescript',
  Python = 'python',
  JavaScript = 'javascript',
  CSharp = 'csharp',
  Go = 'go',
  Java = 'java',
}

/**
 * Type mapping configuration
 */
export interface TypeMapperConfig {
  /** Target language */
  language: TargetLanguage;
  /** Use nullable types (e.g., T? in C#, Optional<T> in Java) */
  useNullable?: boolean;
  /** Custom type mappings */
  customMappings?: Record<string, string>;
}

/**
 * Mapped type result
 */
export interface MappedType {
  /** Type expression in target language */
  type: string;
  /** Required imports */
  imports: string[];
  /** Whether this type is nullable */
  nullable: boolean;
}

/**
 * TypeMapper class
 *
 * Converts canonical types to language-specific types with proper imports
 * and nullability handling.
 */
export class TypeMapper {
  private config: Required<TypeMapperConfig>;
  private typeRegistry: Map<string, TypeDefinition>;

  constructor(config: TypeMapperConfig, types: TypeDefinition[] = []) {
    this.config = {
      useNullable: true,
      customMappings: {},
      ...config,
    };

    this.typeRegistry = new Map(types.map((t) => [t.id, t]));
  }

  /**
   * Map a type reference to the target language
   *
   * @param ref - Type reference to map
   * @returns Mapped type with imports
   */
  mapTypeReference(ref: TypeReference): MappedType {
    const typeDef = this.typeRegistry.get(ref.typeId);

    if (!typeDef) {
      throw new Error(`Type not found: ${ref.typeId}`);
    }

    const mapped = this.mapType(typeDef);

    // Handle nullable
    if (ref.nullable && this.config.useNullable) {
      return this.makeNullable(mapped);
    }

    return mapped;
  }

  /**
   * Map a type definition to the target language
   *
   * @param type - Type definition
   * @returns Mapped type
   */
  mapType(type: TypeDefinition): MappedType {
    switch (type.kind) {
      case TypeKind.Primitive:
        return this.mapPrimitiveType(type.primitiveKind);
      case TypeKind.Object:
        return this.mapObjectType(type.name);
      case TypeKind.Array:
        return this.mapArrayType(type);
      case TypeKind.Union:
        return this.mapUnionType(type);
      case TypeKind.Enum:
        return this.mapEnumType(type.name);
      default:
        throw new Error(`Unsupported type kind: ${(type as TypeDefinition).kind}`);
    }
  }

  /**
   * Map primitive type
   */
  private mapPrimitiveType(primitiveKind: PrimitiveTypeKind): MappedType {
    const mapping = this.getPrimitiveTypeMapping(primitiveKind);
    return { type: mapping, imports: [], nullable: false };
  }

  /**
   * Get primitive type mapping for target language
   */
  private getPrimitiveTypeMapping(kind: PrimitiveTypeKind): string {
    const mappings: Record<TargetLanguage, Record<PrimitiveTypeKind, string>> = {
      [TargetLanguage.Rust]: {
        [PrimitiveTypeKind.String]: 'String',
        [PrimitiveTypeKind.Integer]: 'i64',
        [PrimitiveTypeKind.Float]: 'f64',
        [PrimitiveTypeKind.Boolean]: 'bool',
        [PrimitiveTypeKind.Null]: '()',
      },
      [TargetLanguage.TypeScript]: {
        [PrimitiveTypeKind.String]: 'string',
        [PrimitiveTypeKind.Integer]: 'number',
        [PrimitiveTypeKind.Float]: 'number',
        [PrimitiveTypeKind.Boolean]: 'boolean',
        [PrimitiveTypeKind.Null]: 'null',
      },
      [TargetLanguage.Python]: {
        [PrimitiveTypeKind.String]: 'str',
        [PrimitiveTypeKind.Integer]: 'int',
        [PrimitiveTypeKind.Float]: 'float',
        [PrimitiveTypeKind.Boolean]: 'bool',
        [PrimitiveTypeKind.Null]: 'None',
      },
      [TargetLanguage.JavaScript]: {
        [PrimitiveTypeKind.String]: 'string',
        [PrimitiveTypeKind.Integer]: 'number',
        [PrimitiveTypeKind.Float]: 'number',
        [PrimitiveTypeKind.Boolean]: 'boolean',
        [PrimitiveTypeKind.Null]: 'null',
      },
      [TargetLanguage.CSharp]: {
        [PrimitiveTypeKind.String]: 'string',
        [PrimitiveTypeKind.Integer]: 'long',
        [PrimitiveTypeKind.Float]: 'double',
        [PrimitiveTypeKind.Boolean]: 'bool',
        [PrimitiveTypeKind.Null]: 'null',
      },
      [TargetLanguage.Go]: {
        [PrimitiveTypeKind.String]: 'string',
        [PrimitiveTypeKind.Integer]: 'int64',
        [PrimitiveTypeKind.Float]: 'float64',
        [PrimitiveTypeKind.Boolean]: 'bool',
        [PrimitiveTypeKind.Null]: 'nil',
      },
      [TargetLanguage.Java]: {
        [PrimitiveTypeKind.String]: 'String',
        [PrimitiveTypeKind.Integer]: 'long',
        [PrimitiveTypeKind.Float]: 'double',
        [PrimitiveTypeKind.Boolean]: 'boolean',
        [PrimitiveTypeKind.Null]: 'null',
      },
    };

    return mappings[this.config.language][kind];
  }

  /**
   * Map object type
   */
  private mapObjectType(name: string): MappedType {
    // Check for custom mapping
    if (this.config.customMappings[name]) {
      return { type: this.config.customMappings[name], imports: [], nullable: false };
    }

    // Use the type name in PascalCase (standard for all languages)
    return { type: this.toPascalCase(name), imports: [], nullable: false };
  }

  /**
   * Map array type
   */
  private mapArrayType(type: TypeDefinition): MappedType {
    if (type.kind !== TypeKind.Array) {
      throw new Error('Expected array type');
    }

    const itemType = this.mapTypeReference(type.items);

    const arrayMappings: Record<TargetLanguage, (item: string) => string> = {
      [TargetLanguage.Rust]: (item) => `Vec<${item}>`,
      [TargetLanguage.TypeScript]: (item) => `${item}[]`,
      [TargetLanguage.Python]: (item) => `List[${item}]`,
      [TargetLanguage.JavaScript]: (item) => `${item}[]`,
      [TargetLanguage.CSharp]: (item) => `List<${item}>`,
      [TargetLanguage.Go]: (item) => `[]${item}`,
      [TargetLanguage.Java]: (item) => `List<${item}>`,
    };

    const arrayType = arrayMappings[this.config.language](itemType.type);

    // Add necessary imports
    const imports = [...itemType.imports];
    if (this.config.language === TargetLanguage.Python) {
      imports.push('from typing import List');
    } else if (this.config.language === TargetLanguage.CSharp) {
      imports.push('using System.Collections.Generic;');
    } else if (this.config.language === TargetLanguage.Java) {
      imports.push('import java.util.List;');
    }

    return { type: arrayType, imports, nullable: false };
  }

  /**
   * Map union type
   */
  private mapUnionType(type: TypeDefinition): MappedType {
    if (type.kind !== TypeKind.Union) {
      throw new Error('Expected union type');
    }

    const variants = type.variants.map((v) => this.mapTypeReference(v));

    const unionMappings: Record<TargetLanguage, (variants: MappedType[]) => string> = {
      [TargetLanguage.Rust]: (_variants) => {
        // Rust uses enums for unions
        return this.toPascalCase(type.name); // Return enum name in PascalCase
      },
      [TargetLanguage.TypeScript]: (variants) => {
        return variants.map((v) => v.type).join(' | ');
      },
      [TargetLanguage.Python]: (variants) => {
        return `Union[${variants.map((v) => v.type).join(', ')}]`;
      },
      [TargetLanguage.JavaScript]: (_variants) => {
        // JavaScript doesn't have union types
        return 'any';
      },
      [TargetLanguage.CSharp]: (_variants) => {
        // C# uses object or custom class
        return 'object';
      },
      [TargetLanguage.Go]: (_variants) => {
        // Go uses interface{}
        return 'interface{}';
      },
      [TargetLanguage.Java]: (_variants) => {
        // Java uses Object or custom sealed class (Java 17+)
        return 'Object';
      },
    };

    const unionType = unionMappings[this.config.language](variants);

    const imports = variants.flatMap((v) => v.imports);
    if (this.config.language === TargetLanguage.Python && variants.length > 1) {
      imports.push('from typing import Union');
    }

    return { type: unionType, imports, nullable: false };
  }

  /**
   * Map enum type
   */
  private mapEnumType(name: string): MappedType {
    // Enums are generated types, use the name in PascalCase
    return { type: this.toPascalCase(name), imports: [], nullable: false };
  }

  /**
   * Make a type nullable
   */
  private makeNullable(mapped: MappedType): MappedType {
    const nullableMappings: Record<TargetLanguage, (type: string) => string> = {
      [TargetLanguage.Rust]: (type) => `Option<${type}>`,
      [TargetLanguage.TypeScript]: (type) => `${type} | undefined`,
      [TargetLanguage.Python]: (type) => `Optional[${type}]`,
      [TargetLanguage.JavaScript]: (type) => `${type} | undefined`,
      [TargetLanguage.CSharp]: (type) => `${type}?`,
      [TargetLanguage.Go]: (type) => `*${type}`, // Pointer for nullable
      [TargetLanguage.Java]: (type) => `Optional<${type}>`,
    };

    const imports = [...mapped.imports];
    if (this.config.language === TargetLanguage.Python) {
      imports.push('from typing import Optional');
    } else if (this.config.language === TargetLanguage.Java) {
      imports.push('import java.util.Optional;');
    }

    return {
      type: nullableMappings[this.config.language](mapped.type),
      imports,
      nullable: true,
    };
  }

  /**
   * Add types to the registry
   */
  addTypes(types: TypeDefinition[]): void {
    for (const type of types) {
      this.typeRegistry.set(type.id, type);
    }
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (c) => c.toUpperCase());
  }
}
