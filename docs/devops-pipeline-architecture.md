# LLM-Forge DevOps Pipeline Architecture

## Overview

This document defines the complete build, test, and publishing pipeline for LLM-Forge, supporting automated SDK generation and distribution across six language ecosystems: Rust, TypeScript/JavaScript, Python, C#, Go, and Java.

## Architecture Principles

1. **Monorepo Structure**: All language SDKs generated and maintained in a single repository
2. **Declarative Builds**: All build configurations versioned and reproducible
3. **Language Isolation**: Each SDK can be built, tested, and published independently
4. **Quality First**: No artifacts published without passing all quality gates
5. **Semantic Versioning**: Consistent versioning across all language SDKs
6. **Automated Everything**: From code generation to publication

---

## Pipeline Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRIGGER EVENTS                               │
│  - Manual dispatch                                                   │
│  - API spec changes (spec/*.yaml)                                    │
│  - Template changes (templates/*)                                    │
│  - Version tag push (v*)                                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CODE GENERATION PHASE                           │
│  1. Parse OpenAPI/AsyncAPI specifications                            │
│  2. Generate SDK code for all 6 languages                            │
│  3. Apply templates and customizations                               │
│  4. Validate generated code syntax                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PARALLEL BUILD PHASE                              │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Rust    │  │   TS/JS  │  │  Python  │  │   C#     │           │
│  │  Build   │  │  Build   │  │  Build   │  │  Build   │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                       │
│  ┌──────────┐  ┌──────────┐                                        │
│  │   Go     │  │   Java   │                                        │
│  │  Build   │  │  Build   │                                        │
│  └──────────┘  └──────────┘                                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      QUALITY GATE PHASE                              │
│  - Type checking                                                     │
│  - Unit tests (min 80% coverage)                                    │
│  - Integration tests                                                 │
│  - Linting and formatting                                            │
│  - Security scanning (SAST)                                          │
│  - Dependency vulnerability scan                                     │
│  - License compliance check                                          │
│  - Breaking change detection                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ARTIFACT PACKAGING                               │
│  - Generate documentation                                            │
│  - Build distribution packages                                       │
│  - Sign packages (where applicable)                                  │
│  - Create release notes                                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PUBLISHING PHASE                                  │
│  - Dry-run validation                                                │
│  - Publish to registries                                             │
│  - Create GitHub release                                             │
│  - Update documentation sites                                        │
│  - Notify stakeholders                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
llm-forge/
├── .github/
│   └── workflows/
│       ├── generate.yml           # Code generation workflow
│       ├── build-rust.yml         # Rust build pipeline
│       ├── build-typescript.yml   # TypeScript build pipeline
│       ├── build-python.yml       # Python build pipeline
│       ├── build-csharp.yml       # C# build pipeline
│       ├── build-go.yml           # Go build pipeline
│       ├── build-java.yml         # Java build pipeline
│       ├── quality-gates.yml      # Quality checks
│       ├── publish.yml            # Multi-language publishing
│       └── release.yml            # Release orchestration
│
├── specs/                         # API specifications
│   ├── openapi/
│   └── asyncapi/
│
├── templates/                     # Code generation templates
│   ├── rust/
│   ├── typescript/
│   ├── python/
│   ├── csharp/
│   ├── go/
│   └── java/
│
├── generated/                     # Generated SDK code
│   ├── rust/
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   └── tests/
│   ├── typescript/
│   │   ├── package.json
│   │   ├── src/
│   │   └── tests/
│   ├── python/
│   │   ├── pyproject.toml
│   │   ├── src/
│   │   └── tests/
│   ├── csharp/
│   │   ├── LLMForge.csproj
│   │   ├── src/
│   │   └── tests/
│   ├── go/
│   │   ├── go.mod
│   │   └── pkg/
│   └── java/
│       ├── pom.xml
│       ├── src/
│       └── tests/
│
├── scripts/
│   ├── generate.sh               # Master generation script
│   ├── version.sh                # Version management
│   ├── publish/                  # Publishing scripts per language
│   └── utils/                    # Utility scripts
│
├── docs/
│   ├── devops-pipeline-architecture.md  (this file)
│   ├── build-system-specs.md
│   ├── publishing-guide.md
│   ├── versioning-strategy.md
│   └── quality-gates.md
│
└── VERSION                       # Master version file
```

---

## Build System Integration

### 1. Rust (Cargo → crates.io)

**Build Tool**: Cargo
**Registry**: crates.io
**Package Format**: .crate

**Build Steps**:
```yaml
- name: Build Rust SDK
  steps:
    - cargo fmt --check
    - cargo clippy --all-targets --all-features -- -D warnings
    - cargo build --release
    - cargo test --all-features
    - cargo doc --no-deps
    - cargo package --allow-dirty
```

**Configuration Files**:
- `Cargo.toml`: Package metadata, dependencies, features
- `Cargo.lock`: Locked dependency versions
- `.cargo/config.toml`: Build configuration

**Quality Tools**:
- `rustfmt`: Code formatting
- `clippy`: Linting
- `cargo-audit`: Security scanning
- `cargo-deny`: License compliance
- `cargo-tarpaulin`: Code coverage

### 2. TypeScript/JavaScript (npm → npmjs.com)

**Build Tool**: npm/pnpm/yarn
**Registry**: npmjs.com
**Package Format**: .tgz

**Build Steps**:
```yaml
- name: Build TypeScript SDK
  steps:
    - npm ci
    - npm run lint
    - npm run format:check
    - npm run type-check
    - npm run build
    - npm test -- --coverage
    - npm run docs
    - npm pack
```

**Configuration Files**:
- `package.json`: Package metadata, dependencies, scripts
- `package-lock.json`: Locked dependency versions
- `tsconfig.json`: TypeScript compiler options
- `.eslintrc.json`: Linting rules
- `.prettierrc.json`: Formatting rules

**Quality Tools**:
- `eslint`: Linting
- `prettier`: Code formatting
- `tsc`: Type checking
- `jest`: Testing and coverage
- `typedoc`: Documentation generation
- `npm audit`: Security scanning

### 3. Python (pip/poetry → PyPI)

**Build Tool**: Poetry
**Registry**: PyPI
**Package Format**: .whl + .tar.gz

**Build Steps**:
```yaml
- name: Build Python SDK
  steps:
    - poetry install
    - poetry run black --check .
    - poetry run ruff check .
    - poetry run mypy .
    - poetry run pytest --cov --cov-report=xml
    - poetry run sphinx-build -b html docs/ docs/_build/
    - poetry build
```

**Configuration Files**:
- `pyproject.toml`: Package metadata, dependencies, tool configs
- `poetry.lock`: Locked dependency versions
- `setup.py`: Legacy compatibility (optional)
- `.flake8`: Linting configuration
- `mypy.ini`: Type checking configuration

**Quality Tools**:
- `black`: Code formatting
- `ruff`: Fast linting
- `mypy`: Static type checking
- `pytest`: Testing
- `coverage.py`: Code coverage
- `sphinx`: Documentation generation
- `safety`: Security scanning
- `pip-audit`: Dependency vulnerability scanning

### 4. C# (NuGet → nuget.org)

**Build Tool**: dotnet CLI
**Registry**: nuget.org
**Package Format**: .nupkg

**Build Steps**:
```yaml
- name: Build C# SDK
  steps:
    - dotnet restore
    - dotnet format --verify-no-changes
    - dotnet build --configuration Release
    - dotnet test --configuration Release --collect:"XPlat Code Coverage"
    - dotnet pack --configuration Release
    - docfx docs/docfx.json
```

**Configuration Files**:
- `*.csproj`: Project file with metadata and dependencies
- `Directory.Build.props`: Shared build properties
- `nuget.config`: NuGet source configuration
- `.editorconfig`: Code style rules

**Quality Tools**:
- `dotnet format`: Code formatting
- `StyleCop.Analyzers`: Code analysis
- `FxCop`: Additional analysis
- `xUnit`/`NUnit`: Testing frameworks
- `Coverlet`: Code coverage
- `DocFX`: Documentation generation
- `dotnet list package --vulnerable`: Security scanning

### 5. Go (go modules → pkg.go.dev)

**Build Tool**: go CLI
**Registry**: pkg.go.dev (proxy.golang.org)
**Package Format**: source (git tags)

**Build Steps**:
```yaml
- name: Build Go SDK
  steps:
    - go fmt ./...
    - go vet ./...
    - golangci-lint run
    - go build ./...
    - go test -v -race -coverprofile=coverage.out ./...
    - go test -bench=. ./...
    - godoc -http=:6060  # Documentation check
```

**Configuration Files**:
- `go.mod`: Module definition and dependencies
- `go.sum`: Dependency checksums
- `.golangci.yml`: Linter configuration

**Quality Tools**:
- `gofmt`: Code formatting
- `go vet`: Basic static analysis
- `golangci-lint`: Comprehensive linting
- `staticcheck`: Advanced static analysis
- `gosec`: Security scanning
- `go test`: Testing and coverage
- `godoc`: Documentation generation
- `nancy`/`govulncheck`: Vulnerability scanning

### 6. Java (Maven/Gradle → Maven Central)

**Build Tool**: Maven (primary) / Gradle (alternative)
**Registry**: Maven Central (via Sonatype OSSRH)
**Package Format**: .jar

**Build Steps (Maven)**:
```yaml
- name: Build Java SDK
  steps:
    - mvn clean verify
    - mvn checkstyle:check
    - mvn spotbugs:check
    - mvn test jacoco:report
    - mvn javadoc:javadoc
    - mvn package
    - mvn install
```

**Configuration Files**:
- `pom.xml`: Maven project configuration
- `settings.xml`: Maven settings (credentials)
- `checkstyle.xml`: Code style configuration
- `spotbugs-exclude.xml`: SpotBugs configuration

**Quality Tools**:
- `Checkstyle`: Code style enforcement
- `SpotBugs`: Static analysis
- `PMD`: Code quality analysis
- `JUnit 5`: Testing framework
- `JaCoCo`: Code coverage
- `JavaDoc`: Documentation generation
- `OWASP Dependency-Check`: Security scanning

---

## Pipeline Phases

### Phase 1: Code Generation

**Triggers**:
- Push to `main` branch (specs/ or templates/ changes)
- Manual workflow dispatch
- Scheduled weekly regeneration

**Inputs**:
- API specifications (OpenAPI, AsyncAPI)
- Code generation templates
- Configuration files

**Process**:
1. Validate API specifications
2. Generate code for each language using templates
3. Apply language-specific transformations
4. Validate generated code compiles
5. Commit generated code to repository

**Outputs**:
- Generated SDK source code in `generated/` directory
- Generation report with statistics
- Git commit with changes

**Tools**:
- OpenAPI Generator
- Custom template engine
- Handlebars/Mustache templates
- Language-specific formatters

### Phase 2: Dependency Resolution

**Per Language**:

**Rust**:
```bash
cargo fetch --locked
```

**TypeScript**:
```bash
npm ci --prefer-offline
```

**Python**:
```bash
poetry install --no-root --sync
```

**C#**:
```bash
dotnet restore --locked-mode
```

**Go**:
```bash
go mod download
go mod verify
```

**Java**:
```bash
mvn dependency:go-offline
```

**Caching Strategy**:
- Cache dependency directories per language
- Cache key: hash of lock files
- Restore keys: previous cache versions
- Clear cache weekly or on dependency updates

### Phase 3: Compilation/Transpilation

**Rust**:
```bash
cargo build --release --all-features
```

**TypeScript**:
```bash
tsc --project tsconfig.json
tsc --project tsconfig.esm.json  # ESM build
```

**Python**:
```bash
# Python doesn't require compilation
# But we validate imports
python -m py_compile src/**/*.py
```

**C#**:
```bash
dotnet build --configuration Release --no-restore
```

**Go**:
```bash
go build -v ./...
```

**Java**:
```bash
mvn compile -DskipTests
```

### Phase 4: Testing

**Test Types**:
1. **Unit Tests**: Fast, isolated component tests
2. **Integration Tests**: API integration tests with mock servers
3. **End-to-End Tests**: Full workflow tests
4. **Performance Tests**: Benchmark critical paths

**Per Language**:

**Rust**:
```bash
cargo test --all-features
cargo test --doc
cargo bench --no-run  # Compile benches
```

**TypeScript**:
```bash
jest --coverage --maxWorkers=2
jest --testPathPattern=integration
```

**Python**:
```bash
pytest tests/unit -v --cov=llm_forge --cov-report=xml
pytest tests/integration -v
```

**C#**:
```bash
dotnet test --no-build --configuration Release \
  --collect:"XPlat Code Coverage" \
  --logger trx \
  --results-directory ./TestResults
```

**Go**:
```bash
go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
go test -v -tags=integration ./...
```

**Java**:
```bash
mvn test jacoco:report
mvn verify -P integration-tests
```

**Coverage Thresholds**:
- Minimum: 80% line coverage
- Branches: 75% coverage
- Functions: 85% coverage

### Phase 5: Linting and Formatting

**Auto-fix Mode** (in PRs):
```bash
# Apply fixes automatically
cargo fmt
npm run format
black .
dotnet format
go fmt ./...
mvn spotless:apply
```

**Check Mode** (in CI):
```bash
# Fail if not formatted
cargo fmt -- --check
npm run format:check
black --check .
dotnet format --verify-no-changes
gofmt -l . | grep . && exit 1 || exit 0
mvn spotless:check
```

### Phase 6: Documentation Generation

**Per Language**:

**Rust**:
```bash
cargo doc --no-deps --document-private-items
# Output: target/doc/
```

**TypeScript**:
```bash
typedoc --out docs/api src/index.ts
# Output: docs/api/
```

**Python**:
```bash
sphinx-build -b html docs/ docs/_build/
# Output: docs/_build/
```

**C#**:
```bash
docfx docs/docfx.json
# Output: docs/_site/
```

**Go**:
```bash
# Go uses godoc server, docs hosted on pkg.go.dev automatically
go doc -all > docs/api.txt
```

**Java**:
```bash
mvn javadoc:javadoc
# Output: target/site/apidocs/
```

**Documentation Sites**:
- Host on GitHub Pages
- Separate site per language or unified portal
- Automatic deployment on release

### Phase 7: Packaging

**Per Language**:

**Rust**:
```bash
cargo package --allow-dirty
# Creates: target/package/llm-forge-{version}.crate
```

**TypeScript**:
```bash
npm pack
# Creates: llm-forge-{version}.tgz
```

**Python**:
```bash
poetry build
# Creates: dist/llm_forge-{version}.tar.gz
#          dist/llm_forge-{version}-py3-none-any.whl
```

**C#**:
```bash
dotnet pack --configuration Release --output ./artifacts
# Creates: artifacts/LLMForge.{version}.nupkg
```

**Go**:
```bash
# Go doesn't require packaging, uses git tags
git tag v{version}
```

**Java**:
```bash
mvn package -DskipTests
# Creates: target/llm-forge-{version}.jar
#          target/llm-forge-{version}-sources.jar
#          target/llm-forge-{version}-javadoc.jar
```

### Phase 8: Publishing

**Registry Publishing**:

**Rust (crates.io)**:
```bash
cargo publish --token $CARGO_TOKEN
```

**TypeScript (npmjs.com)**:
```bash
npm publish --access public
```

**Python (PyPI)**:
```bash
poetry publish --username __token__ --password $PYPI_TOKEN
```

**C# (nuget.org)**:
```bash
dotnet nuget push artifacts/*.nupkg \
  --api-key $NUGET_TOKEN \
  --source https://api.nuget.org/v3/index.json
```

**Go (pkg.go.dev)**:
```bash
git tag v{version}
git push origin v{version}
# Automatically indexed by pkg.go.dev
```

**Java (Maven Central)**:
```bash
# Via Sonatype OSSRH
mvn deploy -P release \
  -Dgpg.passphrase=$GPG_PASSPHRASE
```

**Pre-publish Validation**:
1. Dry-run publish to test credentials
2. Verify package contents
3. Check package metadata
4. Validate README rendering
5. Test package installation in clean environment

---

## Quality Gates

See detailed specifications in `/workspaces/llm-forge/docs/quality-gates.md`

**Gate 1: Compilation**
- All code must compile without errors
- No compiler warnings allowed

**Gate 2: Type Checking**
- Static type analysis passes
- No type errors in strongly-typed languages

**Gate 3: Unit Tests**
- All unit tests pass
- Minimum 80% code coverage
- No flaky tests

**Gate 4: Integration Tests**
- API integration tests pass
- Mock server tests validate contracts

**Gate 5: Code Quality**
- Linting passes with no violations
- Code formatting consistent
- Complexity metrics within bounds

**Gate 6: Security Scanning**
- No high/critical vulnerabilities in dependencies
- SAST findings reviewed and addressed
- Secret scanning passes

**Gate 7: License Compliance**
- All dependencies have compatible licenses
- License headers present
- NOTICE file updated

**Gate 8: Breaking Change Detection**
- API compatibility checked
- Breaking changes documented
- Version number incremented correctly

---

## Versioning Strategy

See detailed specifications in `/workspaces/llm-forge/docs/versioning-strategy.md`

**Version Format**: `MAJOR.MINOR.PATCH` (Semantic Versioning 2.0.0)

**Version Synchronization**:
- All language SDKs share the same version number
- Single source of truth: `VERSION` file at repository root
- Version updated via automated scripts

**Increment Rules**:

1. **MAJOR** (Breaking Changes):
   - API endpoint removed or renamed
   - Request/response structure changed incompatibly
   - Required parameters added
   - Behavior changes that break existing code

2. **MINOR** (Backward-Compatible Features):
   - New API endpoints added
   - Optional parameters added
   - New SDK methods/functions
   - New functionality that doesn't break existing code

3. **PATCH** (Bug Fixes):
   - Bug fixes without API changes
   - Documentation updates
   - Performance improvements
   - Security patches (non-breaking)

**Pre-release Versions**:
- Alpha: `1.0.0-alpha.1` (unstable, breaking changes expected)
- Beta: `1.0.0-beta.1` (feature complete, stabilizing)
- RC: `1.0.0-rc.1` (release candidate, final testing)

**Version Management Workflow**:

```bash
# scripts/version.sh
#!/bin/bash

CURRENT_VERSION=$(cat VERSION)
VERSION_TYPE=$1  # major, minor, patch

# Bump version
NEW_VERSION=$(semver bump $VERSION_TYPE $CURRENT_VERSION)

# Update all package files
echo $NEW_VERSION > VERSION
sed -i "s/version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" generated/rust/Cargo.toml
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" generated/typescript/package.json
sed -i "s/version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" generated/python/pyproject.toml
# ... update other languages

git commit -am "chore: bump version to $NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
```

**Breaking Change Detection**:
- Use `oasdiff` to compare OpenAPI specs
- Track API surface changes per language
- Automated PR checks warn about breaking changes

---

## CI/CD Integration

See detailed workflow specifications in `/workspaces/llm-forge/docs/ci-cd-workflows.md`

**GitHub Actions Workflows**:

1. **Code Generation** (`.github/workflows/generate.yml`)
   - Trigger: Push to `specs/` or `templates/`
   - Generates SDK code
   - Creates PR with changes

2. **Pull Request Validation** (`.github/workflows/pr-validation.yml`)
   - Runs on all PRs
   - Builds all SDKs
   - Runs all quality gates
   - Posts results as PR comment

3. **Main Branch Build** (`.github/workflows/main-build.yml`)
   - Runs on push to `main`
   - Full build and test
   - No publishing

4. **Release** (`.github/workflows/release.yml`)
   - Trigger: Version tag push (`v*`)
   - Builds all SDKs
   - Runs all quality gates
   - Publishes to all registries
   - Creates GitHub release
   - Updates documentation

5. **Scheduled Tasks** (`.github/workflows/scheduled.yml`)
   - Daily: Dependency vulnerability scan
   - Weekly: Full regeneration and test
   - Monthly: Dependency updates

**Multi-Language Testing Matrix**:

```yaml
strategy:
  matrix:
    language: [rust, typescript, python, csharp, go, java]
    os: [ubuntu-latest, macos-latest, windows-latest]
    exclude:
      # OS-specific exclusions if needed
```

**Secrets Management**:
- `CARGO_TOKEN`: crates.io API token
- `NPM_TOKEN`: npmjs.com API token
- `PYPI_TOKEN`: PyPI API token
- `NUGET_TOKEN`: nuget.org API token
- `GPG_PRIVATE_KEY`: For signing Java artifacts
- `GPG_PASSPHRASE`: GPG key passphrase
- `SONATYPE_USERNAME`: Maven Central username
- `SONATYPE_PASSWORD`: Maven Central password

**Environment Separation**:
- Development: Publish to test registries
- Staging: Publish to private registry
- Production: Publish to public registries

---

## Monitoring and Observability

**Build Metrics**:
- Build duration per language
- Test execution time
- Code coverage trends
- Dependency update frequency

**Quality Metrics**:
- Test success rate
- Code coverage percentage
- Linting violations count
- Security vulnerabilities found

**Publishing Metrics**:
- Download counts per language
- Version adoption rates
- Time from tag to publish

**Alerting**:
- Build failures notify team
- Security vulnerabilities trigger alerts
- Publish failures escalate to on-call

**Dashboards**:
- GitHub Actions insights
- Registry download statistics
- Dependency health reports

---

## Rollback and Recovery

**Failed Publishing**:
1. Identify failed language SDK
2. Fix issue in code or pipeline
3. Re-tag with patch version increment
4. Re-run publishing workflow

**Yanking Published Versions**:

**Rust**:
```bash
cargo yank --version {version}
```

**TypeScript**:
```bash
npm unpublish llm-forge@{version}
```

**Python**:
```bash
# Contact PyPI support (cannot unpublish)
# Mark version as yanked in metadata
```

**C#**:
```bash
dotnet nuget delete LLMForge {version} \
  --api-key $NUGET_TOKEN \
  --source https://api.nuget.org/v3/index.json
```

**Go**:
```bash
# Cannot delete tags from pkg.go.dev
# Issue retraction in go.mod
```

**Java**:
```bash
# Contact Sonatype support
# Maven Central does not allow deletion
```

**Emergency Procedures**:
1. Identify scope of issue
2. Document incident
3. Yank affected versions
4. Publish fixed version immediately
5. Post-mortem and process improvement

---

## Future Enhancements

1. **Multi-Registry Support**:
   - Private registries for enterprise customers
   - Mirror repositories for reliability

2. **Canary Releases**:
   - Gradual rollout to subset of users
   - Automatic rollback on errors

3. **Performance Benchmarking**:
   - Track SDK performance over time
   - Catch performance regressions

4. **Advanced Security**:
   - Sign all packages with GPG/signing keys
   - SBOM (Software Bill of Materials) generation
   - Provenance attestation

5. **Documentation Improvements**:
   - Auto-generated API reference from code
   - Interactive examples and tutorials
   - Video walkthroughs

6. **Community Features**:
   - Public roadmap
   - Community contribution guidelines
   - Plugin/extension system

---

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Cargo Documentation](https://doc.rust-lang.org/cargo/)
- [npm Documentation](https://docs.npmjs.com/)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [NuGet Documentation](https://docs.microsoft.com/en-us/nuget/)
- [Go Modules Reference](https://go.dev/ref/mod)
- [Maven Central Guide](https://central.sonatype.org/publish/)

---

## Appendix: Quick Reference Commands

### Build All SDKs
```bash
./scripts/build-all.sh
```

### Test All SDKs
```bash
./scripts/test-all.sh
```

### Bump Version
```bash
./scripts/version.sh [major|minor|patch]
```

### Publish All SDKs
```bash
./scripts/publish-all.sh
```

### Generate Code
```bash
./scripts/generate.sh --all
```

### Check Quality Gates
```bash
./scripts/quality-gates.sh
```
