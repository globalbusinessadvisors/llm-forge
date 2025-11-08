# LLM-Forge Quality Gates

## Overview

Quality gates are automated checkpoints that ensure code quality, security, and reliability before any SDK can be published. All gates must pass for a release to proceed.

---

## Gate Definitions

### Gate 1: Code Compilation

**Purpose**: Ensure all generated code compiles without errors

**Criteria**:
- Zero compilation errors
- Zero compilation warnings (treated as errors)
- All language-specific build artifacts generated successfully

**Per Language**:

**Rust**:
```yaml
- run: cargo build --release --all-features
  env:
    RUSTFLAGS: "-D warnings"
```
- Exit code must be 0
- No error messages in output

**TypeScript**:
```yaml
- run: tsc --noEmit
```
- No TypeScript errors
- All types resolved correctly

**Python**:
```yaml
- run: python -m py_compile $(find src -name "*.py")
```
- All .py files compile without SyntaxError

**C#**:
```yaml
- run: dotnet build --configuration Release /warnaserror
```
- Build succeeds with warnings as errors

**Go**:
```yaml
- run: go build ./...
```
- All packages build successfully

**Java**:
```yaml
- run: mvn compile -Werror
```
- Compilation succeeds with warnings as errors

**Gate Actions**:
- PASS: Proceed to next gate
- FAIL: Block build, notify developers, create issue

---

### Gate 2: Type Checking

**Purpose**: Validate static types and prevent type errors

**Criteria**:
- All type annotations correct
- No type inference failures
- Generics properly constrained

**Per Language**:

**Rust**:
```yaml
# Built into compilation, no separate check needed
```

**TypeScript**:
```yaml
- run: npm run type-check
  # Runs: tsc --noEmit --strict
```
**Strictness Settings**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Python**:
```yaml
- run: poetry run mypy src --strict
```
**Mypy Configuration**:
```ini
[mypy]
strict = True
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
```

**C#**:
```yaml
# Built into compilation
# Enable nullable reference types in .csproj:
<Nullable>enable</Nullable>
<WarningsAsErrors>CS8600;CS8601;CS8602;CS8603;CS8604</WarningsAsErrors>
```

**Go**:
```yaml
# Built into compilation, Go is statically typed
```

**Java**:
```yaml
# Built into compilation
# Enable strict type checking with Checker Framework (optional)
```

**Thresholds**:
- 0 type errors allowed
- 100% type coverage in TypeScript/Python

---

### Gate 3: Unit Tests

**Purpose**: Validate individual components work correctly in isolation

**Criteria**:
- All unit tests pass
- Minimum 80% line coverage
- Minimum 75% branch coverage
- Minimum 85% function coverage
- No flaky tests (tests must be deterministic)
- Test execution time < 5 minutes per language

**Per Language**:

**Rust**:
```yaml
- run: cargo test --all-features
- run: cargo tarpaulin --out Xml --output-dir ./coverage
```
**Coverage Configuration** (tarpaulin.toml):
```toml
[coverage]
line = 80
branch = 75
```

**TypeScript**:
```yaml
- run: jest --coverage --coverageReporters=lcov --coverageReporters=text
```
**Jest Configuration** (jest.config.js):
```javascript
module.exports = {
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 75,
      functions: 85,
      statements: 80
    }
  }
};
```

**Python**:
```yaml
- run: poetry run pytest --cov=llm_forge --cov-report=xml --cov-report=term
  --cov-fail-under=80
```
**Coverage Configuration** (.coveragerc):
```ini
[report]
fail_under = 80
precision = 2

[run]
branch = True
```

**C#**:
```yaml
- run: dotnet test --collect:"XPlat Code Coverage"
- run: reportgenerator -reports:**/coverage.cobertura.xml -targetdir:./coverage
```
**Configuration** (Directory.Build.props):
```xml
<PropertyGroup>
  <CodeCoverageLineThreshold>80</CodeCoverageLineThreshold>
  <CodeCoverageBranchThreshold>75</CodeCoverageBranchThreshold>
</PropertyGroup>
```

**Go**:
```yaml
- run: go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
- run: go tool cover -func=coverage.out | grep total | awk '{print $3}'
  # Should be >= 80%
```

**Java**:
```yaml
- run: mvn test jacoco:report jacoco:check
```
**JaCoCo Configuration** (pom.xml):
```xml
<configuration>
  <rules>
    <rule>
      <element>BUNDLE</element>
      <limits>
        <limit>
          <counter>LINE</counter>
          <value>COVEREDRATIO</value>
          <minimum>0.80</minimum>
        </limit>
        <limit>
          <counter>BRANCH</counter>
          <value>COVEREDRATIO</value>
          <minimum>0.75</minimum>
        </limit>
      </limits>
    </rule>
  </rules>
</configuration>
```

**Test Organization**:
- Unit tests in `tests/unit/` or `src/**/*.test.*`
- Test files mirror source structure
- One test file per source file
- Clear test names describing behavior

**Gate Actions**:
- PASS: Coverage meets thresholds, all tests pass
- FAIL: Block build, generate coverage report, identify gaps

---

### Gate 4: Integration Tests

**Purpose**: Validate SDK works correctly with external services

**Criteria**:
- All integration tests pass
- API contracts validated
- Error handling verified
- Retry logic tested
- Timeout handling validated

**Per Language**:

**Rust**:
```yaml
- run: cargo test --test integration -- --test-threads=1
```

**TypeScript**:
```yaml
- run: jest --testPathPattern=integration --runInBand
```

**Python**:
```yaml
- run: poetry run pytest tests/integration -v --tb=short
```

**C#**:
```yaml
- run: dotnet test --filter Category=Integration
```

**Go**:
```yaml
- run: go test -v -tags=integration ./...
```

**Java**:
```yaml
- run: mvn verify -P integration-tests
```

**Test Environment**:
- Mock API servers (WireMock, Mockito, etc.)
- Containerized dependencies (Docker Compose)
- Test fixtures with realistic data
- Isolated test databases

**Integration Test Scenarios**:
1. Successful API calls
2. Authentication flows
3. Rate limiting handling
4. Network errors and retries
5. Timeout scenarios
6. Malformed response handling
7. Large payload handling
8. Concurrent request handling

**Gate Actions**:
- PASS: All integration tests succeed
- FAIL: Block build, log failures, preserve test artifacts

---

### Gate 5: Code Quality (Linting & Formatting)

**Purpose**: Enforce consistent code style and catch common errors

**Criteria**:
- Code formatting matches style guide
- No linting violations
- Cyclomatic complexity < 10 per function
- No code smells (duplicated code, long functions, etc.)

**Per Language**:

**Rust**:
```yaml
- run: cargo fmt -- --check
- run: cargo clippy --all-targets --all-features -- -D warnings
```
**Clippy Configuration** (clippy.toml):
```toml
cognitive-complexity-threshold = 10
```

**TypeScript**:
```yaml
- run: npm run format:check  # prettier --check
- run: npm run lint          # eslint
```
**ESLint Configuration** (.eslintrc.json):
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "rules": {
    "complexity": ["error", 10],
    "max-lines-per-function": ["warn", 50],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**Python**:
```yaml
- run: poetry run black --check .
- run: poetry run ruff check .
```
**Ruff Configuration** (pyproject.toml):
```toml
[tool.ruff]
select = ["E", "F", "W", "C90", "I", "N", "UP", "S", "B", "A"]
ignore = []

[tool.ruff.mccabe]
max-complexity = 10
```

**C#**:
```yaml
- run: dotnet format --verify-no-changes
- run: dotnet build /p:EnforceCodeStyleInBuild=true
```
**EditorConfig** (.editorconfig):
```ini
[*.cs]
dotnet_diagnostic.CA1502.severity = error  # Cyclomatic complexity
dotnet_code_quality.CA1502.max_complexity = 10
```

**Go**:
```yaml
- run: gofmt -l . | grep . && exit 1 || exit 0
- run: golangci-lint run --timeout 5m
```
**GolangCI-Lint Configuration** (.golangci.yml):
```yaml
linters:
  enable:
    - gofmt
    - gocyclo
    - govet
    - staticcheck
    - gosec
    - revive

linters-settings:
  gocyclo:
    min-complexity: 10
```

**Java**:
```yaml
- run: mvn checkstyle:check
- run: mvn spotbugs:check
- run: mvn pmd:check
```
**Checkstyle Configuration** (checkstyle.xml):
```xml
<module name="CyclomaticComplexity">
  <property name="max" value="10"/>
</module>
```

**Gate Actions**:
- PASS: No linting errors, formatting correct
- FAIL: Block build, provide auto-fix suggestions

---

### Gate 6: Security Scanning

**Purpose**: Identify security vulnerabilities in code and dependencies

**Criteria**:
- No critical vulnerabilities in dependencies
- No high-severity vulnerabilities in code (SAST)
- Secrets not committed to repository
- No hardcoded credentials or API keys

**Dependency Scanning**:

**Rust**:
```yaml
- run: cargo audit --deny warnings
```

**TypeScript**:
```yaml
- run: npm audit --audit-level=high
- run: npm audit signatures
```

**Python**:
```yaml
- run: poetry run safety check --json
- run: poetry run pip-audit
```

**C#**:
```yaml
- run: dotnet list package --vulnerable --include-transitive
```

**Go**:
```yaml
- run: govulncheck ./...
```

**Java**:
```yaml
- run: mvn org.owasp:dependency-check-maven:check
```

**Static Application Security Testing (SAST)**:

**All Languages**:
```yaml
- uses: github/codeql-action/init
- uses: github/codeql-action/analyze
```

**Rust**:
```yaml
- run: cargo clippy -- -D clippy::suspicious
```

**Python**:
```yaml
- run: poetry run bandit -r src/
```

**Go**:
```yaml
- run: gosec ./...
```

**Java**:
```yaml
- run: mvn spotbugs:check -Dspotbugs.failOnError=true
```

**Secret Scanning**:
```yaml
- uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
```

**Vulnerability Severity Thresholds**:
- **Critical**: 0 allowed (block build)
- **High**: 0 allowed (block build)
- **Medium**: 5 allowed (warning, requires justification)
- **Low**: Unlimited (informational)

**Exception Process**:
- Document false positives in `.security-exceptions.yml`
- Require security team approval for exceptions
- Review exceptions quarterly

**Gate Actions**:
- PASS: No vulnerabilities above threshold
- FAIL: Block build, create security issues, notify security team

---

### Gate 7: License Compliance

**Purpose**: Ensure all dependencies use compatible licenses

**Criteria**:
- All dependencies have approved licenses
- No GPL/AGPL in dependencies (copyleft restriction)
- License headers present in all source files
- NOTICE file includes all third-party attributions

**Approved Licenses**:
- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- CC0-1.0

**Prohibited Licenses**:
- GPL (all versions)
- AGPL (all versions)
- Proprietary licenses
- Unlicensed code

**Per Language**:

**Rust**:
```yaml
- run: cargo install cargo-deny
- run: cargo deny check licenses
```
**Configuration** (deny.toml):
```toml
[licenses]
allow = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC"]
deny = ["GPL-2.0", "GPL-3.0", "AGPL-3.0"]
```

**TypeScript**:
```yaml
- run: npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC"
```

**Python**:
```yaml
- run: poetry run pip-licenses --fail-on "GPL;AGPL"
```

**C#**:
```yaml
- run: dotnet tool install -g dotnet-project-licenses
- run: dotnet-project-licenses --input . --output-directory ./licenses
```

**Go**:
```yaml
- run: go install github.com/google/go-licenses@latest
- run: go-licenses check ./...
```

**Java**:
```yaml
- run: mvn license:add-third-party
- run: mvn license:check-licenses
```

**License Header Check**:

**Example Header** (Apache-2.0):
```
Copyright 2024 LLM-Forge Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

**Automated Header Insertion**:
```yaml
- uses: apache/skywalking-eyes/header@main
  with:
    config: .licenserc.yaml
```

**Gate Actions**:
- PASS: All licenses approved, headers present
- FAIL: Block build, list non-compliant dependencies, suggest alternatives

---

### Gate 8: Breaking Change Detection

**Purpose**: Prevent unintentional breaking changes and enforce semantic versioning

**Criteria**:
- API surface changes documented
- Breaking changes require major version bump
- Backward compatibility maintained for minor/patch releases
- Deprecation warnings for future breaking changes

**OpenAPI/AsyncAPI Spec Comparison**:
```yaml
- uses: oasdiff/oasdiff-action@main
  with:
    base: ${{ github.event.pull_request.base.sha }}:specs/openapi.yaml
    revision: HEAD:specs/openapi.yaml
    fail-on-diff: true
    fail-on-breaking: true
```

**Per Language API Compatibility Check**:

**Rust**:
```yaml
- run: cargo install cargo-semver-checks
- run: cargo semver-checks check-release
```

**TypeScript**:
```yaml
- uses: microsoft/api-extractor@main
- run: npm run api-check  # Compares .api.md files
```

**Python**:
```yaml
- run: poetry run griffe check llm_forge --against origin/main
```

**C#**:
```yaml
- uses: dotnet/roslyn-analyzers/PublicApiAnalyzer
```

**Go**:
```yaml
- run: go install golang.org/x/exp/cmd/gorelease@latest
- run: gorelease
```

**Java**:
```yaml
- run: mvn japicmp:cmp
```

**Breaking Change Categories**:

1. **API Removals**:
   - Endpoint removed
   - Method/function removed
   - Class removed

2. **Signature Changes**:
   - Parameter added (required)
   - Parameter removed
   - Parameter type changed
   - Return type changed

3. **Behavior Changes**:
   - Default value changed
   - Exception behavior changed
   - Side effects changed

4. **Structural Changes**:
   - Interface contract changed
   - Inheritance hierarchy changed
   - Visibility reduced (public → private)

**Deprecation Process**:
1. Mark API as deprecated in current version
2. Add deprecation warning with migration guide
3. Maintain deprecated API for 1 major version
4. Remove in next major version

**Example Deprecation**:

**Rust**:
```rust
#[deprecated(since = "1.5.0", note = "Use `new_method` instead")]
pub fn old_method() { }
```

**TypeScript**:
```typescript
/**
 * @deprecated Use newMethod instead. Will be removed in v2.0.0
 */
function oldMethod() { }
```

**Python**:
```python
import warnings

def old_method():
    warnings.warn(
        "old_method is deprecated, use new_method instead",
        DeprecationWarning,
        stacklevel=2
    )
```

**Gate Actions**:
- PASS: No breaking changes or version incremented correctly
- FAIL: Block build, require version bump, update changelog
- WARNING: Deprecations detected, ensure migration guide present

---

## Quality Gate Execution Order

```
1. Code Compilation ────> FAIL ────> Stop
         │
         ▼ PASS
2. Type Checking ───────> FAIL ────> Stop
         │
         ▼ PASS
3. Unit Tests ──────────> FAIL ────> Stop
         │
         ▼ PASS
4. Integration Tests ───> FAIL ────> Stop
         │
         ▼ PASS
5. Code Quality ────────> FAIL ────> Stop
         │
         ▼ PASS
6. Security Scanning ───> FAIL ────> Stop
         │
         ▼ PASS
7. License Compliance ──> FAIL ────> Stop
         │
         ▼ PASS
8. Breaking Changes ────> FAIL ────> Stop
         │
         ▼ PASS
   ✅ All Gates Passed
   Proceed to Publishing
```

---

## Quality Gate Dashboard

**Metrics to Track**:
- Gate pass rate per language
- Time spent in each gate
- Most common gate failures
- Quality trends over time

**Dashboard Implementation**:
- GitHub Actions badges in README
- Codecov integration for coverage
- SonarQube/SonarCloud for code quality
- Snyk for security vulnerabilities

**Example Badges**:
```markdown
![Build Status](https://github.com/llm-forge/llm-forge/workflows/CI/badge.svg)
![Coverage](https://codecov.io/gh/llm-forge/llm-forge/branch/main/graph/badge.svg)
![License](https://img.shields.io/github/license/llm-forge/llm-forge)
```

---

## Gate Override Process

**Emergency Override**:
- Requires approval from 2+ maintainers
- Document reason in override request
- Create follow-up issue to fix
- Review in next retrospective

**Override Request Template**:
```yaml
Gate: [Gate Name]
Reason: [Why override is needed]
Impact: [What is the risk?]
Mitigation: [How will we fix this?]
Approvers: [@maintainer1, @maintainer2]
```

**Override Types**:
1. **Temporary**: Fix in next patch release
2. **Permanent Exception**: Document in exceptions file
3. **Gate Modification**: Update gate criteria if too strict

---

## Continuous Improvement

**Quality Gate Reviews**:
- Quarterly review of gate effectiveness
- Adjust thresholds based on data
- Add new gates as needed
- Remove obsolete gates

**Feedback Loop**:
- Collect developer feedback on gates
- Measure impact on development velocity
- Balance quality vs. speed
- Iterate on gate implementation

**Success Metrics**:
- Reduced production bugs
- Faster time to resolution
- Higher developer satisfaction
- Increased code coverage
- Fewer security incidents

---

## Appendix: Quick Reference

### Check All Gates Locally

```bash
#!/bin/bash
# scripts/quality-gates.sh

set -e

echo "🔍 Running Quality Gates..."

echo "Gate 1: Compilation"
./scripts/build-all.sh

echo "Gate 2: Type Checking"
./scripts/type-check-all.sh

echo "Gate 3: Unit Tests"
./scripts/test-all.sh

echo "Gate 4: Integration Tests"
./scripts/integration-test-all.sh

echo "Gate 5: Code Quality"
./scripts/lint-all.sh

echo "Gate 6: Security Scanning"
./scripts/security-scan-all.sh

echo "Gate 7: License Compliance"
./scripts/license-check-all.sh

echo "Gate 8: Breaking Changes"
./scripts/breaking-change-check.sh

echo "✅ All Quality Gates Passed!"
```

### Skip Specific Gates (Development Only)

```bash
SKIP_GATES="integration,security" ./scripts/quality-gates.sh
```

**Note**: Never skip gates in CI/CD pipeline!
