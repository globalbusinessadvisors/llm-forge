# LLM-Forge Versioning Strategy

## Overview

This document defines the versioning strategy for LLM-Forge SDKs across all six supported languages. We follow **Semantic Versioning 2.0.0** with synchronized versions across all language ecosystems.

---

## Semantic Versioning

### Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

**Examples**:
- `1.0.0` - First stable release
- `1.5.2` - Minor feature with patches
- `2.0.0-alpha.1` - Pre-release version
- `1.0.0+build.123` - Build metadata

### Version Components

#### MAJOR Version (X.0.0)

**Increment when making incompatible API changes**

**Examples**:
- Removing API endpoints
- Changing required parameters
- Modifying response structures (non-additive)
- Removing public methods/functions/classes
- Changing method signatures
- Removing enum values
- Changing default behavior that breaks existing usage

**Breaking Changes in Generated SDKs**:

**Scenario 1: Endpoint Removal**
```diff
// OpenAPI Spec Change
paths:
- /v1/completions:  # REMOVED
-   post: ...
  /v1/chat/completions:
    post: ...
```
**Impact**: Client code calling `client.completions.create()` will fail
**Version**: `1.x.x → 2.0.0`

**Scenario 2: Required Parameter Added**
```diff
// OpenAPI Spec Change
parameters:
  - name: model
    required: true
+ - name: api_version
+   required: true  # NEW REQUIRED PARAM
```
**Impact**: Existing calls without `api_version` will fail
**Version**: `1.x.x → 2.0.0`

**Scenario 3: Response Structure Changed**
```diff
// OpenAPI Spec Change
Response:
  type: object
  properties:
-   data: string      # Changed from string to object
+   data:
+     type: object
```
**Impact**: Code expecting `response.data` as string will fail
**Version**: `1.x.x → 2.0.0`

#### MINOR Version (X.Y.0)

**Increment when adding functionality in a backward-compatible manner**

**Examples**:
- Adding new API endpoints
- Adding optional parameters
- Adding new response fields (additive)
- Adding new public methods/functions/classes
- Adding new enum values
- Deprecating functionality (with notice)

**New Features in Generated SDKs**:

**Scenario 1: New Endpoint**
```diff
// OpenAPI Spec Change
paths:
  /v1/chat/completions:
    post: ...
+ /v1/embeddings:      # NEW ENDPOINT
+   post: ...
```
**Impact**: New method `client.embeddings.create()` available
**Version**: `1.5.0 → 1.6.0`

**Scenario 2: Optional Parameter Added**
```diff
// OpenAPI Spec Change
parameters:
  - name: model
    required: true
+ - name: temperature  # NEW OPTIONAL PARAM
+   required: false
```
**Impact**: Existing code continues to work, new parameter available
**Version**: `1.5.0 → 1.6.0`

**Scenario 3: Response Field Added**
```diff
// OpenAPI Spec Change
Response:
  properties:
    data: string
+   metadata:         # NEW FIELD
+     type: object
```
**Impact**: Existing code unaffected, new field available
**Version**: `1.5.0 → 1.6.0`

#### PATCH Version (X.Y.Z)

**Increment when making backward-compatible bug fixes**

**Examples**:
- Bug fixes in generated code
- Documentation updates
- Internal refactoring
- Performance improvements (no API changes)
- Security patches (non-breaking)
- Dependency updates (compatible)

**Bug Fixes in Generated SDKs**:

**Scenario 1: Bug Fix**
```diff
// Bug: Incorrect date serialization
- serialized_date = date.isoformat()
+ serialized_date = date.isoformat() + 'Z'  # Fixed timezone
```
**Impact**: Existing code works better
**Version**: `1.5.2 → 1.5.3`

**Scenario 2: Performance Improvement**
```diff
// Performance: Use connection pooling
- http_client = HTTPClient()
+ http_client = HTTPClient(pool_connections=10)
```
**Impact**: Faster performance, same API
**Version**: `1.5.2 → 1.5.3`

---

## Pre-release Versions

### Alpha (Early Testing)

**Format**: `X.Y.Z-alpha.N`

**Example**: `2.0.0-alpha.1`

**Characteristics**:
- Unstable, breaking changes expected
- Feature incomplete
- For internal testing only
- Not published to public registries
- May have missing functionality

**Use Cases**:
- Early development of major versions
- Proof-of-concept features
- Internal validation

**Publishing**:
- Private registry or GitHub releases only
- Tagged as pre-release
- Not recommended for production

### Beta (Feature Complete)

**Format**: `X.Y.Z-beta.N`

**Example**: `2.0.0-beta.1`

**Characteristics**:
- Feature complete
- API surface frozen
- Stabilization phase
- Bug fixes only
- Public testing encouraged

**Use Cases**:
- Public preview of new major version
- Community testing and feedback
- Migration guide validation

**Publishing**:
- Published to public registries
- Tagged as pre-release
- Use with caution in production

### Release Candidate (Final Testing)

**Format**: `X.Y.Z-rc.N`

**Example**: `2.0.0-rc.1`

**Characteristics**:
- No known critical bugs
- Final testing before release
- No new features
- Critical bug fixes only

**Use Cases**:
- Final validation before stable release
- Early adopters in production
- Migration testing

**Publishing**:
- Published to public registries
- Tagged as pre-release
- Production-ready with caveat

### Pre-release Ordering

```
1.0.0-alpha.1
  < 1.0.0-alpha.2
  < 1.0.0-beta.1
  < 1.0.0-beta.2
  < 1.0.0-rc.1
  < 1.0.0-rc.2
  < 1.0.0
```

---

## Version Synchronization

### Single Source of Truth

All language SDKs share the same version number, maintained in:

```
/workspaces/llm-forge/VERSION
```

**File Contents**:
```
1.5.2
```

### Cross-Language Version Updates

When version is bumped, all package files are updated:

**Rust** (`generated/rust/Cargo.toml`):
```toml
[package]
name = "llm-forge"
version = "1.5.2"
```

**TypeScript** (`generated/typescript/package.json`):
```json
{
  "name": "llm-forge",
  "version": "1.5.2"
}
```

**Python** (`generated/python/pyproject.toml`):
```toml
[tool.poetry]
name = "llm-forge"
version = "1.5.2"
```

**C#** (`generated/csharp/LLMForge.csproj`):
```xml
<PropertyGroup>
  <Version>1.5.2</Version>
</PropertyGroup>
```

**Go** (Git tag):
```bash
git tag v1.5.2
```

**Java** (`generated/java/pom.xml`):
```xml
<version>1.5.2</version>
```

### Version Bump Script

**File**: `/workspaces/llm-forge/scripts/version.sh`

```bash
#!/bin/bash
set -e

BUMP_TYPE=$1  # major, minor, patch, prerelease

if [ -z "$BUMP_TYPE" ]; then
  echo "Usage: $0 [major|minor|patch|prerelease]"
  exit 1
fi

# Read current version
CURRENT_VERSION=$(cat VERSION)
echo "Current version: $CURRENT_VERSION"

# Calculate new version using semver tool
NEW_VERSION=$(npx semver $CURRENT_VERSION -i $BUMP_TYPE)
echo "New version: $NEW_VERSION"

# Update VERSION file
echo $NEW_VERSION > VERSION

# Update Rust
sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" generated/rust/Cargo.toml

# Update TypeScript
cd generated/typescript
npm version $NEW_VERSION --no-git-tag-version
cd ../..

# Update Python
sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" generated/python/pyproject.toml

# Update C#
sed -i "s|<Version>.*</Version>|<Version>$NEW_VERSION</Version>|" generated/csharp/LLMForge.csproj

# Update Java
mvn -f generated/java/pom.xml versions:set -DnewVersion=$NEW_VERSION -DgenerateBackupPoms=false

# Commit changes
git add VERSION generated/*/
git commit -m "chore: bump version to $NEW_VERSION"

# Create git tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo "✅ Version bumped to $NEW_VERSION"
echo "📝 Next steps:"
echo "   1. Review changes: git show"
echo "   2. Push commit: git push origin main"
echo "   3. Push tag: git push origin v$NEW_VERSION"
```

**Usage**:
```bash
./scripts/version.sh major    # 1.5.2 → 2.0.0
./scripts/version.sh minor    # 1.5.2 → 1.6.0
./scripts/version.sh patch    # 1.5.2 → 1.5.3
./scripts/version.sh prerelease  # 1.5.2 → 1.5.3-alpha.0
```

---

## Breaking Change Detection

### Automated Detection

**OpenAPI Spec Comparison**:
```yaml
# .github/workflows/breaking-change-check.yml
name: Breaking Change Detection

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Check OpenAPI Breaking Changes
        uses: oasdiff/oasdiff-action@v0.0.19
        with:
          base: origin/main:specs/openapi.yaml
          revision: HEAD:specs/openapi.yaml
          format: text
          fail-on: ERR
```

**Output Example**:
```
Breaking Changes:
1. endpoint removed: DELETE /v1/models/{id}
2. request property made required: api_version
3. response property type changed: data (string → object)

Non-Breaking Changes:
1. endpoint added: POST /v1/embeddings
2. optional parameter added: temperature
```

### Per-Language API Compatibility

**Rust**:
```yaml
- name: Cargo Semver Checks
  run: |
    cargo install cargo-semver-checks
    cargo semver-checks check-release
```

**TypeScript**:
```yaml
- name: API Extractor
  run: |
    npm run build:api  # Generates .api.md
    api-extractor run --local
    git diff --exit-code ./api/*.api.md
```

**Python**:
```yaml
- name: Griffe API Check
  run: |
    poetry run griffe dump llm_forge -o current.json
    poetry run griffe check llm_forge --against origin/main
```

**Go**:
```yaml
- name: Gorelease
  run: |
    go install golang.org/x/exp/cmd/gorelease@latest
    gorelease -base=origin/main
```

**Java**:
```yaml
- name: JApiCmp
  run: |
    mvn japicmp:cmp -DoldVersion=RELEASE
```

### Breaking Change Report

**Generated in PR Comments**:

```markdown
## Breaking Change Analysis

### OpenAPI Changes
- ⚠️ **Breaking**: Endpoint removed: `DELETE /v1/models/{id}`
- ⚠️ **Breaking**: Required parameter added: `api_version`
- ✅ **Non-breaking**: New endpoint added: `POST /v1/embeddings`

### Impact Assessment
- **Affected Methods**:
  - Rust: `client.models().delete()`
  - TypeScript: `client.models.delete()`
  - Python: `client.models.delete()`
  - C#: `client.Models.Delete()`
  - Go: `client.Models.Delete()`
  - Java: `client.models().delete()`

### Recommended Version Bump
Based on breaking changes detected: **MAJOR** version bump required

Current version: `1.5.2`
Recommended version: `2.0.0`

### Migration Guide Required
Please provide migration instructions for affected methods.
```

---

## Deprecation Policy

### Deprecation Process

**Step 1: Mark as Deprecated (Minor Version)**

**Rust**:
```rust
#[deprecated(since = "1.5.0", note = "Use `new_method` instead. Will be removed in v2.0.0")]
pub fn old_method() -> Result<Response> {
    // Implementation
}
```

**TypeScript**:
```typescript
/**
 * @deprecated Use newMethod instead. Will be removed in v2.0.0
 * @see {@link newMethod}
 */
function oldMethod(): Promise<Response> {
  // Implementation
}
```

**Python**:
```python
import warnings

def old_method() -> Response:
    """
    .. deprecated:: 1.5.0
       Use :func:`new_method` instead. Will be removed in v2.0.0
    """
    warnings.warn(
        "old_method is deprecated, use new_method instead. "
        "Will be removed in v2.0.0",
        DeprecationWarning,
        stacklevel=2
    )
    # Implementation
```

**C#**:
```csharp
[Obsolete("Use NewMethod instead. Will be removed in v2.0.0")]
public Response OldMethod() {
    // Implementation
}
```

**Go**:
```go
// Deprecated: Use NewMethod instead. Will be removed in v2.0.0
func OldMethod() (*Response, error) {
    // Implementation
}
```

**Java**:
```java
/**
 * @deprecated Use {@link #newMethod()} instead. Will be removed in v2.0.0
 */
@Deprecated(since = "1.5.0", forRemoval = true)
public Response oldMethod() {
    // Implementation
}
```

**Step 2: Maintain Deprecated API (1 Major Version)**

- Keep deprecated API functional in v1.x.x
- Log deprecation warnings when used
- Provide migration examples in documentation

**Step 3: Remove in Next Major Version**

- Remove in v2.0.0
- Document removal in changelog
- Provide upgrade guide

### Deprecation Timeline

```
v1.5.0: Feature deprecated, warning added
v1.6.0: Still available with warning
v1.7.0: Still available with warning
...
v2.0.0: Feature removed
```

**Minimum Deprecation Period**: 6 months or 1 major version, whichever is longer

---

## Version Compatibility Matrix

### SDK Version Compatibility

| SDK Version | API Version | Minimum API Version |
|-------------|-------------|---------------------|
| 2.0.x       | v2          | v2                  |
| 1.5.x       | v1          | v1                  |
| 1.0.x       | v1          | v1                  |

### Language Version Support

| Language   | Minimum Version | Recommended Version | EOL Policy          |
|------------|-----------------|---------------------|---------------------|
| Rust       | 1.70.0          | Latest stable       | Latest 2 minor      |
| TypeScript | 4.9.0           | 5.x                 | TS official policy  |
| Python     | 3.8             | 3.11+               | Active support only |
| C#         | .NET 6.0        | .NET 8.0            | LTS versions        |
| Go         | 1.20            | 1.21+               | Latest 2 minor      |
| Java       | 11              | 17 LTS              | LTS versions        |

### Dependency Version Constraints

**Conservative Strategy**: Pin to minor versions, allow patch updates

**Rust** (`Cargo.toml`):
```toml
[dependencies]
serde = "1.0"          # Allows 1.0.x
tokio = "~1.35"        # Allows 1.35.x
```

**TypeScript** (`package.json`):
```json
{
  "dependencies": {
    "axios": "^1.6.0"   // Allows 1.x.x
  }
}
```

**Python** (`pyproject.toml`):
```toml
[tool.poetry.dependencies]
httpx = "^0.25.0"      # Allows 0.25.x
pydantic = "^2.5"      # Allows 2.x.x
```

---

## Release Process

### 1. Version Decision

**Checklist**:
- [ ] Review all changes since last release
- [ ] Check breaking change detection reports
- [ ] Decide version bump type (major/minor/patch)
- [ ] Document decision in release notes

### 2. Version Bump

```bash
./scripts/version.sh [major|minor|patch]
```

### 3. Changelog Update

**File**: `CHANGELOG.md`

```markdown
## [2.0.0] - 2024-11-15

### Breaking Changes
- Removed deprecated `client.completions()` method
- Changed `Response.data` from string to object
- Minimum Python version increased to 3.8

### Added
- New embeddings API support
- Streaming response support
- Batch request handling

### Fixed
- Date serialization in Python SDK
- Memory leak in TypeScript client

### Migration Guide
See [MIGRATION_v2.md](./docs/MIGRATION_v2.md) for detailed upgrade instructions.
```

### 4. Create Release PR

```bash
git checkout -b release/v2.0.0
git add CHANGELOG.md
git commit -m "docs: update changelog for v2.0.0"
git push origin release/v2.0.0
```

### 5. Review and Merge

- CI/CD runs all quality gates
- Team reviews changes
- Merge to main

### 6. Tag and Publish

```bash
git checkout main
git pull origin main
git push origin v2.0.0  # Pushes the tag created by version.sh
```

### 7. GitHub Release

- CI/CD automatically creates GitHub release
- Attaches compiled artifacts
- Includes changelog excerpt

### 8. Publish to Registries

- CI/CD publishes to all language registries
- Verifies successful publication
- Updates documentation sites

### 9. Announce

- Post to GitHub Discussions
- Update documentation site
- Notify users via email/blog
- Social media announcement

---

## Version Rollback

### Scenario 1: Critical Bug in Published Release

**Option A: Yank Version (Preferred)**

**Rust**:
```bash
cargo yank --version 2.0.0
```

**TypeScript**:
```bash
npm deprecate llm-forge@2.0.0 "Critical bug, use 2.0.1 instead"
```

**Python**:
```bash
# Contact PyPI support to yank
# Or mark as yanked in metadata
```

**Option B: Publish Patch Release**

```bash
# Fix the bug
git checkout -b hotfix/v2.0.1
# Make fixes
./scripts/version.sh patch  # 2.0.0 → 2.0.1
git push origin hotfix/v2.0.1
# Tag and publish
```

### Scenario 2: Incorrect Version Number

**Cannot Change Published Versions**

Registries do not allow re-publishing same version:
- Publish corrected version with incremented number
- Yank incorrect version
- Document in release notes

---

## Version Verification

### Pre-publish Verification

```bash
#!/bin/bash
# scripts/verify-version.sh

VERSION=$(cat VERSION)

echo "Verifying version $VERSION across all packages..."

# Check Rust
RUST_VERSION=$(grep '^version = ' generated/rust/Cargo.toml | cut -d'"' -f2)
[ "$RUST_VERSION" = "$VERSION" ] || { echo "Rust version mismatch"; exit 1; }

# Check TypeScript
TS_VERSION=$(node -p "require('./generated/typescript/package.json').version")
[ "$TS_VERSION" = "$VERSION" ] || { echo "TypeScript version mismatch"; exit 1; }

# Check Python
PY_VERSION=$(grep '^version = ' generated/python/pyproject.toml | cut -d'"' -f2)
[ "$PY_VERSION" = "$VERSION" ] || { echo "Python version mismatch"; exit 1; }

# Check C#
CS_VERSION=$(grep '<Version>' generated/csharp/LLMForge.csproj | sed 's/.*<Version>\(.*\)<\/Version>.*/\1/')
[ "$CS_VERSION" = "$VERSION" ] || { echo "C# version mismatch"; exit 1; }

# Check Java
JAVA_VERSION=$(mvn -f generated/java/pom.xml help:evaluate -Dexpression=project.version -q -DforceStdout)
[ "$JAVA_VERSION" = "$VERSION" ] || { echo "Java version mismatch"; exit 1; }

echo "✅ All versions match: $VERSION"
```

### Post-publish Verification

```bash
#!/bin/bash
# scripts/verify-published.sh

VERSION=$1

echo "Verifying published version $VERSION..."

# Check crates.io
curl -s https://crates.io/api/v1/crates/llm-forge | jq -r '.versions[0].num' | grep -q "$VERSION"

# Check npmjs.com
npm view llm-forge version | grep -q "$VERSION"

# Check PyPI
pip index versions llm-forge | grep -q "$VERSION"

# Check nuget.org
curl -s https://api.nuget.org/v3/registration5-gz-semver2/llmforge/index.json | jq -r '.items[].items[].catalogEntry.version' | grep -q "$VERSION"

# Check pkg.go.dev (wait for indexing)
sleep 60
curl -s "https://pkg.go.dev/github.com/llm-forge/llm-forge@v$VERSION" | grep -q "$VERSION"

# Check Maven Central (wait for sync)
sleep 300
curl -s "https://search.maven.org/solrsearch/select?q=g:com.llmforge+AND+a:llm-forge+AND+v:$VERSION" | grep -q "$VERSION"

echo "✅ Version $VERSION published to all registries"
```

---

## Version History

### Example Version History

```
v2.0.0 - 2024-11-15 - Major release with breaking changes
v1.5.2 - 2024-10-20 - Patch: Fix date serialization bug
v1.5.1 - 2024-10-10 - Patch: Security update
v1.5.0 - 2024-09-25 - Minor: Add embeddings support
v1.4.0 - 2024-08-30 - Minor: Add streaming support
v1.3.0 - 2024-07-15 - Minor: Add batch requests
v1.2.0 - 2024-06-01 - Minor: Add retry logic
v1.1.0 - 2024-05-10 - Minor: Add timeout configuration
v1.0.0 - 2024-04-01 - First stable release
v0.9.0 - 2024-03-15 - Release candidate
v0.1.0 - 2024-01-01 - Initial alpha release
```

---

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Cargo Semver Compatibility](https://doc.rust-lang.org/cargo/reference/semver.html)
- [npm Semantic Versioning](https://docs.npmjs.com/about-semantic-versioning)
- [Python Version Specifiers](https://peps.python.org/pep-0440/)
- [NuGet Semantic Versioning](https://learn.microsoft.com/en-us/nuget/concepts/package-versioning)
- [Go Module Versioning](https://go.dev/doc/modules/version-numbers)
- [Maven Version Ordering](https://maven.apache.org/pom.html#version-order-specification)
