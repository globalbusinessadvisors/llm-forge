# LLM-Forge Quick Reference

## Project at a Glance

**Purpose**: Generate typed SDKs for multiple LLM providers across 7 languages
**Status**: Phase 0 - Foundation & Setup
**Target**: v0.1.0 release in 20 weeks

## Key Numbers

- **7 Languages**: Rust, TypeScript, Python, JavaScript, C#, Go, Java
- **5 Providers**: OpenAI, Anthropic, Cohere, Google AI, Mistral
- **13 Agents**: Specialized development team
- **5 Phases**: 0 (Foundation) through 4 (Production Ready)
- **90%+ Coverage**: Test coverage requirement
- **<5s**: Generation time target per language

## Architecture Layers (Top to Bottom)

1. **CLI & Orchestration** - User interface and configuration
2. **Provider Adapters** - Parse provider API specs
3. **Schema Normalization** - Canonical schema (language-agnostic)
4. **Code Generation Engine** - Template rendering
5. **Language Target Renderers** - Generate idiomatic code
6. **Build & Package** - Native package managers

## Agent Roster

### Tier 1: Foundation (Critical Path)
- **Schema Architect**: Canonical schema + provider adapters
- **Template Engine**: Handlebars engine + helpers

### Tier 2: Implementation (Parallel)
- **TypeScript Agent**: First reference implementation
- **Python Agent**: Python SDK generation
- **Rust Agent**: Rust SDK generation
- **JavaScript Agent**: JavaScript SDK generation
- **C# Agent**: C# SDK generation
- **Go Agent**: Go SDK generation
- **Java Agent**: Java SDK generation

### Tier 3: Infrastructure (Support)
- **Build Pipeline**: Orchestration + packaging
- **Testing & Quality**: Cross-language testing
- **Documentation**: User + developer docs
- **CLI & DevEx**: User interface

## Phase Overview

### Phase 0: Foundation (Weeks 1-2) ⏳ CURRENT
- Architecture design ✅
- Roadmap planning ✅
- Agent coordination ✅
- Proof of concept ⏱️

### Phase 1: Core Infrastructure (Weeks 3-6)
- Schema normalization engine
- Template engine
- Provider adapters (OpenAI, Anthropic)
- CLI foundation
- Testing infrastructure

### Phase 2: First Language (Weeks 7-10)
- Complete TypeScript SDK generation
- End-to-end validation
- Reference implementation

### Phase 3: Multi-Language (Weeks 11-16)
- All 7 language targets
- 3 more providers (Cohere, Google, Mistral)
- Cross-language parity tests

### Phase 4: Production Ready (Weeks 17-20)
- Security hardening
- Performance optimization
- Plugin system
- Complete documentation
- v0.1.0 release

## Critical Paths

### Week-by-Week Critical Path

| Week | Critical Task | Agent |
|------|--------------|-------|
| 1-2 | Proof of concept | SwarmLead |
| 3-6 | Canonical schema | Schema Architect |
| 3-6 | Template engine | Template Engine |
| 7-10 | TypeScript SDK | TypeScript Agent |
| 11-12 | Python SDK | Python Agent |
| 12-13 | Rust SDK | Rust Agent |
| 13-14 | Go SDK | Go Agent |
| 14-16 | JS, C#, Java SDKs | JS, C#, Java Agents |
| 17-20 | Integration & polish | All Agents |

## Integration Points

### Key Interfaces

1. **Canonical Schema**
   - Location: `/core/schema/canonical-schema.json`
   - Format: JSON Schema
   - Consumers: All generators

2. **Template Engine API**
   - Location: `/templates/engine.ts`
   - Methods: `render()`, `registerHelper()`, `validateTemplate()`
   - Consumers: All language agents

3. **Generated Output**
   - Format: `GeneratedOutput` interface
   - Contents: Files + build config + dependencies
   - Consumers: Build pipeline

## Type Mapping Reference

| Canonical | Rust | TypeScript | Python | Go | C# | Java |
|-----------|------|------------|--------|----|----|----|
| String | String | string | str | string | string | String |
| Integer | i64 | number | int | int64 | long | long |
| Float | f64 | number | float | float64 | double | double |
| Boolean | bool | boolean | bool | bool | bool | boolean |
| Array<T> | Vec<T> | T[] | List[T] | []T | List<T> | List<T> |
| Optional<T> | Option<T> | T\|undefined | Optional[T] | *T | T? | Optional<T> |

## Quality Gates

### Every Commit
- ✅ Tests pass (>90% coverage)
- ✅ Linting clean
- ✅ Type checking passes

### Every PR
- ✅ Code review approved
- ✅ Integration tests pass
- ✅ Documentation updated

### Every Phase
- ✅ All deliverables complete
- ✅ Integration validated
- ✅ Performance benchmarks met
- ✅ SwarmLead approval

## Communication Protocols

### Daily Standups (Async)
- Post in `.swarm/standups/YYYY-MM-DD.md`
- Include: Yesterday's progress, Today's plan, Blockers

### Weekly Integration Review
- SwarmLead coordinates
- Review integration points
- Address blockers
- Update roadmap

### Conflict Resolution
1. Agents attempt consensus
2. Escalate to SwarmLead
3. SwarmLead decides based on architecture principles
4. Document decision in `.swarm/decisions/`

## Directory Structure

```
llm-forge/
├── .swarm/              # Coordination files
│   ├── assignments/     # Task assignments
│   ├── standups/        # Daily updates
│   ├── decisions/       # Architecture decisions
│   └── integration-points/
├── core/                # Core generator (TypeScript)
│   ├── schema/          # Schema normalization
│   ├── adapters/        # Provider adapters
│   ├── templates/       # Template engine
│   └── generators/      # Language generators
├── cli/                 # CLI tool
├── templates/           # Language templates
│   ├── common/
│   ├── rust/
│   ├── typescript/
│   ├── python/
│   └── [others]
├── schemas/             # Schema definitions
├── tests/               # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── examples/            # Example applications
├── docs/                # Documentation
│   ├── ARCHITECTURE.md
│   ├── BUILD_ROADMAP.md
│   ├── AGENT_COORDINATION.md
│   ├── AGENT_RESPONSIBILITIES.md
│   └── SWARMLEAD_SUMMARY.md
└── .github/             # CI/CD workflows
```

## File Ownership

| Path | Owner | Consumers |
|------|-------|-----------|
| `core/schema/` | Schema Architect | All generators |
| `core/templates/` | Template Engine | All language agents |
| `templates/rust/` | Rust Agent | Build Pipeline |
| `templates/typescript/` | TypeScript Agent | Build Pipeline |
| `cli/` | CLI Agent | End users |
| `tests/integration/` | Testing Agent | All agents |
| `docs/` | Documentation Agent | Everyone |

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run specific agent tests
npm test -- --grep "Schema"

# Lint
npm run lint

# Type check
npm run type-check

# Build
npm run build
```

### Generation (Future)
```bash
# Initialize config
llm-forge init

# Validate configuration
llm-forge validate

# Generate SDKs
llm-forge generate

# Generate specific language
llm-forge generate --language=typescript

# Generate specific provider
llm-forge generate --provider=openai

# Dry run
llm-forge generate --dry-run
```

## Success Metrics

### Development Metrics
- **Code Quality**: >90% test coverage, zero critical bugs
- **Performance**: <5s generation time per language
- **Documentation**: 100% public API documented

### Generated SDK Metrics
- **Compilation**: 100% of generated code compiles
- **Type Safety**: Full type inference in all languages
- **Size**: <50KB minified for web targets
- **Dependencies**: <5 external dependencies per SDK

## Risk Heat Map

| Risk | Probability | Impact | Status |
|------|-------------|--------|--------|
| Provider API changes | Medium | High | Mitigated (adapters) |
| Type system complexity | Medium | Medium | Monitoring |
| Cross-language consistency | Low | High | Mitigated (tests) |
| Performance issues | Low | Medium | Monitoring |
| Scope creep | Medium | High | Controlled (phases) |

## Quick Links

### Documentation
- [Architecture](ARCHITECTURE.md) - System design
- [Build Roadmap](BUILD_ROADMAP.md) - Development plan
- [Agent Coordination](AGENT_COORDINATION.md) - Protocols
- [Agent Responsibilities](AGENT_RESPONSIBILITIES.md) - Roles
- [SwarmLead Summary](SWARMLEAD_SUMMARY.md) - Executive summary

### External Resources
- [Handlebars](https://handlebarsjs.com/) - Template engine
- [JSON Schema](https://json-schema.org/) - Schema validation
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework

## Contact

- **SwarmLead**: Claude (Sonnet 4.5)
- **Repository**: `/workspaces/llm-forge`
- **License**: Apache 2.0

---

**Last Updated**: 2025-11-07
**Current Phase**: Phase 0 - Foundation & Setup
**Next Milestone**: Proof of Concept
