# LLM-Forge Publishing Guide

## Overview

This guide provides detailed instructions for publishing LLM-Forge SDKs to package registries across all six supported language ecosystems. It covers both automated (CI/CD) and manual publishing processes.

---

## Table of Contents

1. [Pre-Publishing Checklist](#pre-publishing-checklist)
2. [Rust (crates.io)](#rust-cratesio)
3. [TypeScript/JavaScript (npmjs.com)](#typescriptjavascript-npmjscom)
4. [Python (PyPI)](#python-pypi)
5. [C# (nuget.org)](#c-nugetorg)
6. [Go (pkg.go.dev)](#go-pkggodev)
7. [Java (Maven Central)](#java-maven-central)
8. [Automated Publishing](#automated-publishing)
9. [Post-Publishing Tasks](#post-publishing-tasks)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Publishing Checklist

Before publishing any SDK version, complete this checklist:

### Version Preparation

- [ ] All changes merged to `main` branch
- [ ] VERSION file updated with new version number
- [ ] All package files updated with new version
- [ ] CHANGELOG.md updated with release notes
- [ ] Migration guide written (if breaking changes)
- [ ] All tests passing locally
- [ ] All quality gates passing in CI/CD
- [ ] Documentation updated

### Quality Verification

- [ ] Code compiles without warnings
- [ ] All unit tests pass (80%+ coverage)
- [ ] Integration tests pass
- [ ] Linting and formatting compliant
- [ ] No security vulnerabilities
- [ ] License compliance verified
- [ ] Breaking changes documented

### Registry Credentials

- [ ] Registry API tokens configured
- [ ] GitHub secrets updated
- [ ] GPG keys available (for signing)
- [ ] Access permissions verified

### Documentation

- [ ] API documentation generated
- [ ] README.md reviewed and updated
- [ ] Code examples tested
- [ ] Migration guide complete (if needed)

---

## Rust (crates.io)

### Registry Information

- **Registry**: [crates.io](https://crates.io/)
- **Package Format**: `.crate` (compressed tar archive)
- **Authentication**: API token
- **Signing**: Not required
- **Documentation**: Auto-hosted on [docs.rs](https://docs.rs/)

### Setup

#### 1. Create crates.io Account

```bash
# Visit https://crates.io/ and create account
# Generate API token at https://crates.io/settings/tokens
```

#### 2. Configure Credentials

```bash
# Login to crates.io
cargo login YOUR_API_TOKEN

# Token stored in ~/.cargo/credentials.toml
```

#### 3. Verify Package Metadata

**File**: `generated/rust/Cargo.toml`

```toml
[package]
name = "llm-forge"
version = "1.5.2"
edition = "2021"
authors = ["LLM-Forge Contributors"]
license = "Apache-2.0"
description = "Rust SDK for LLM-Forge API"
homepage = "https://github.com/llm-forge/llm-forge"
repository = "https://github.com/llm-forge/llm-forge"
documentation = "https://docs.rs/llm-forge"
readme = "README.md"
keywords = ["llm", "ai", "api", "sdk"]
categories = ["api-bindings", "web-programming::http-client"]

[package.metadata.docs.rs]
all-features = true
rustdoc-args = ["--cfg", "docsrs"]
```

### Publishing Process

#### Manual Publishing

```bash
cd generated/rust

# 1. Build and test
cargo build --release --all-features
cargo test --all-features

# 2. Generate documentation locally
cargo doc --no-deps --open

# 3. Dry run (verifies package without publishing)
cargo publish --dry-run

# 4. Package the crate
cargo package

# 5. Inspect package contents
cargo package --list

# 6. Publish to crates.io
cargo publish

# Wait for confirmation
echo "Published! View at: https://crates.io/crates/llm-forge"
```

#### Verify Publication

```bash
# Check crate page
curl https://crates.io/api/v1/crates/llm-forge

# Test installation
cargo new test-llm-forge
cd test-llm-forge
cargo add llm-forge@1.5.2
cargo build
```

### Post-Publishing

- Documentation automatically built on [docs.rs](https://docs.rs/llm-forge)
- Wait 5-10 minutes for docs to appear
- Verify docs rendered correctly

### Unpublishing (Yanking)

```bash
# Yank a specific version (prevents new projects from using it)
cargo yank --version 1.5.2

# Un-yank a version
cargo yank --version 1.5.2 --undo
```

**Note**: Yanking does not delete the package, only marks it as not recommended.

---

## TypeScript/JavaScript (npmjs.com)

### Registry Information

- **Registry**: [npmjs.com](https://www.npmjs.com/)
- **Package Format**: `.tgz` (tarball)
- **Authentication**: Token or password
- **Signing**: Optional (npm provenance)
- **Documentation**: README on npm page

### Setup

#### 1. Create npm Account

```bash
# Visit https://www.npmjs.com/signup
# Enable 2FA (required for publishing)
```

#### 2. Configure Credentials

```bash
# Login via CLI
npm login

# Or configure token directly
echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN" > ~/.npmrc
```

#### 3. Verify Package Metadata

**File**: `generated/typescript/package.json`

```json
{
  "name": "llm-forge",
  "version": "1.5.2",
  "description": "TypeScript SDK for LLM-Forge API",
  "main": "./dist/index.js",
  "module": "./dist/index.esm.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.esm.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc && tsc -p tsconfig.esm.json",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": ["llm", "ai", "api", "sdk", "typescript"],
  "author": "LLM-Forge Contributors",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/llm-forge/llm-forge.git",
    "directory": "generated/typescript"
  },
  "homepage": "https://github.com/llm-forge/llm-forge#readme",
  "bugs": "https://github.com/llm-forge/llm-forge/issues",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Publishing Process

#### Manual Publishing

```bash
cd generated/typescript

# 1. Install dependencies
npm ci

# 2. Build
npm run build

# 3. Test
npm test

# 4. Verify package contents
npm pack --dry-run

# 5. Create tarball (optional, for inspection)
npm pack

# 6. Publish to npm (with provenance)
npm publish --access public --provenance

# For scoped packages
npm publish --access public
```

#### Verify Publication

```bash
# Check package page
npm view llm-forge

# Test installation
mkdir test-llm-forge
cd test-llm-forge
npm init -y
npm install llm-forge@1.5.2
node -e "require('llm-forge')"
```

### Post-Publishing

- README rendered on npm page
- Package available immediately
- Update package documentation if needed

### Unpublishing / Deprecation

```bash
# Deprecate a version (preferred)
npm deprecate llm-forge@1.5.2 "Critical bug, use 1.5.3 instead"

# Unpublish (only within 72 hours)
npm unpublish llm-forge@1.5.2

# Unpublish entire package (dangerous!)
npm unpublish llm-forge --force
```

**Warning**: Unpublishing can break dependent projects. Use deprecation instead.

---

## Python (PyPI)

### Registry Information

- **Registry**: [PyPI](https://pypi.org/)
- **Package Format**: `.whl` (wheel) + `.tar.gz` (source)
- **Authentication**: API token
- **Signing**: Optional (GPG)
- **Documentation**: README on PyPI page

### Setup

#### 1. Create PyPI Account

```bash
# Visit https://pypi.org/account/register/
# Enable 2FA
# Create API token at https://pypi.org/manage/account/token/
```

#### 2. Configure Credentials

**File**: `~/.pypirc`

```ini
[pypi]
username = __token__
password = pypi-YOUR_API_TOKEN_HERE

[testpypi]
username = __token__
password = pypi-YOUR_TEST_TOKEN_HERE
```

Or use Poetry config:

```bash
poetry config pypi-token.pypi YOUR_API_TOKEN
```

#### 3. Verify Package Metadata

**File**: `generated/python/pyproject.toml`

```toml
[tool.poetry]
name = "llm-forge"
version = "1.5.2"
description = "Python SDK for LLM-Forge API"
authors = ["LLM-Forge Contributors <hello@llm-forge.dev>"]
license = "Apache-2.0"
readme = "README.md"
homepage = "https://github.com/llm-forge/llm-forge"
repository = "https://github.com/llm-forge/llm-forge"
documentation = "https://llm-forge.readthedocs.io"
keywords = ["llm", "ai", "api", "sdk"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: Apache Software License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]

[tool.poetry.dependencies]
python = "^3.8"
httpx = "^0.25.0"
pydantic = "^2.5"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
```

### Publishing Process

#### Manual Publishing

```bash
cd generated/python

# 1. Install dependencies
poetry install

# 2. Run tests
poetry run pytest --cov

# 3. Build distribution packages
poetry build

# Output:
# - dist/llm_forge-1.5.2-py3-none-any.whl
# - dist/llm_forge-1.5.2.tar.gz

# 4. Verify package contents
tar -tzf dist/llm_forge-1.5.2.tar.gz

# 5. Test on TestPyPI (optional)
poetry publish -r testpypi

# 6. Publish to PyPI
poetry publish

# Or using twine
pip install twine
twine check dist/*
twine upload dist/*
```

#### Verify Publication

```bash
# Check package page
pip index versions llm-forge

# Test installation
python -m venv test-env
source test-env/bin/activate
pip install llm-forge==1.5.2
python -c "import llm_forge; print(llm_forge.__version__)"
```

### Post-Publishing

- README rendered on PyPI page (supports Markdown)
- Package available within minutes
- Consider hosting documentation on ReadTheDocs

### Unpublishing / Yanking

```bash
# PyPI does not allow unpublishing
# Contact PyPI support for removal requests
# Or mark as yanked (pip will skip unless explicitly requested)

# Yanking is done through PyPI web interface:
# 1. Go to https://pypi.org/manage/project/llm-forge/release/1.5.2/
# 2. Click "Options" → "Yank release"
```

---

## C# (nuget.org)

### Registry Information

- **Registry**: [nuget.org](https://www.nuget.org/)
- **Package Format**: `.nupkg` (ZIP-based)
- **Authentication**: API key
- **Signing**: Recommended (certificate)
- **Documentation**: README on NuGet page

### Setup

#### 1. Create NuGet Account

```bash
# Visit https://www.nuget.org/users/account/LogOn
# Create API key at https://www.nuget.org/account/apikeys
```

#### 2. Configure Credentials

```bash
# Store API key
dotnet nuget add source https://api.nuget.org/v3/index.json \
  --name nuget.org \
  --username YOUR_USERNAME \
  --password YOUR_API_KEY \
  --store-password-in-clear-text
```

#### 3. Verify Package Metadata

**File**: `generated/csharp/LLMForge.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
    <Version>1.5.2</Version>
    <PackageId>LLMForge</PackageId>
    <Title>LLM-Forge SDK</Title>
    <Authors>LLM-Forge Contributors</Authors>
    <Company>LLM-Forge</Company>
    <Description>C# SDK for LLM-Forge API</Description>
    <Copyright>Copyright © 2024 LLM-Forge Contributors</Copyright>
    <PackageLicenseExpression>Apache-2.0</PackageLicenseExpression>
    <PackageProjectUrl>https://github.com/llm-forge/llm-forge</PackageProjectUrl>
    <RepositoryUrl>https://github.com/llm-forge/llm-forge</RepositoryUrl>
    <RepositoryType>git</RepositoryType>
    <PackageTags>llm;ai;api;sdk;csharp</PackageTags>
    <PackageReadmeFile>README.md</PackageReadmeFile>
    <PackageIcon>icon.png</PackageIcon>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>

  <ItemGroup>
    <None Include="README.md" Pack="true" PackagePath="/" />
    <None Include="icon.png" Pack="true" PackagePath="/" />
  </ItemGroup>
</Project>
```

### Publishing Process

#### Manual Publishing

```bash
cd generated/csharp

# 1. Restore dependencies
dotnet restore

# 2. Build
dotnet build --configuration Release

# 3. Test
dotnet test --configuration Release

# 4. Pack
dotnet pack --configuration Release --output ./artifacts

# 5. Verify package contents
unzip -l ./artifacts/LLMForge.1.5.2.nupkg

# 6. Publish to NuGet.org
dotnet nuget push ./artifacts/LLMForge.1.5.2.nupkg \
  --api-key YOUR_API_KEY \
  --source https://api.nuget.org/v3/index.json

# Wait for indexing (5-10 minutes)
```

#### Verify Publication

```bash
# Check package
dotnet add package LLMForge --version 1.5.2

# Test in new project
dotnet new console -n TestLLMForge
cd TestLLMForge
dotnet add package LLMForge --version 1.5.2
dotnet build
```

### Post-Publishing

- Package appears on nuget.org after indexing
- README rendered on package page
- Icon displayed if provided

### Unpublishing / Unlisting

```bash
# Unlist package (hides from search, but still installable)
dotnet nuget delete LLMForge 1.5.2 \
  --api-key YOUR_API_KEY \
  --source https://api.nuget.org/v3/index.json \
  --non-interactive

# Note: This unlists, doesn't delete permanently
```

---

## Go (pkg.go.dev)

### Registry Information

- **Registry**: [pkg.go.dev](https://pkg.go.dev/) (via proxy.golang.org)
- **Package Format**: Source (git repository)
- **Authentication**: Not required (uses git tags)
- **Signing**: Git tag signing
- **Documentation**: Auto-generated from comments

### Setup

#### 1. Verify Module Configuration

**File**: `generated/go/go.mod`

```go
module github.com/llm-forge/llm-forge

go 1.21

require (
    github.com/google/uuid v1.5.0
    // ... other dependencies
)
```

#### 2. Configure Git Signing (Optional)

```bash
# Generate GPG key
gpg --gen-key

# Configure Git to use GPG key
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

### Publishing Process

#### Manual Publishing

```bash
cd generated/go

# 1. Run tests
go test -v ./...

# 2. Verify module
go mod verify
go mod tidy

# 3. Commit changes
git add .
git commit -m "chore: prepare v1.5.2 release"

# 4. Create signed tag
git tag -s -a v1.5.2 -m "Release v1.5.2"

# 5. Push tag to repository
git push origin v1.5.2

# 6. Request indexing by pkg.go.dev
# Visit: https://pkg.go.dev/github.com/llm-forge/llm-forge@v1.5.2
# Or trigger via API:
curl "https://proxy.golang.org/github.com/llm-forge/llm-forge/@v/v1.5.2.info"

# Wait 5-10 minutes for indexing
```

#### Verify Publication

```bash
# Check module info
go list -m -versions github.com/llm-forge/llm-forge

# Test installation
mkdir test-llm-forge
cd test-llm-forge
go mod init example.com/test
go get github.com/llm-forge/llm-forge@v1.5.2
```

### Post-Publishing

- Documentation auto-generated from Go comments
- Examples in `_test.go` files appear on pkg.go.dev
- Badge available: `[![Go Reference](https://pkg.go.dev/badge/github.com/llm-forge/llm-forge.svg)](https://pkg.go.dev/github.com/llm-forge/llm-forge)`

### Retracting Versions

**File**: `go.mod`

```go
module github.com/llm-forge/llm-forge

go 1.21

retract (
    v1.5.2 // Critical bug, use v1.5.3
)
```

Commit and tag new version with retraction.

---

## Java (Maven Central)

### Registry Information

- **Registry**: [Maven Central](https://central.sonatype.com/)
- **Package Format**: `.jar` (+ sources + javadoc)
- **Authentication**: Username + password + GPG
- **Signing**: Required (GPG)
- **Documentation**: Javadoc JAR

### Setup

#### 1. Create Sonatype Account

```bash
# Visit https://issues.sonatype.org/secure/Signup!default.jspa
# Create JIRA ticket to claim group ID (com.llmforge)
# Wait for approval (1-2 business days)
```

#### 2. Generate GPG Key

```bash
# Generate key
gpg --gen-key

# List keys
gpg --list-keys

# Export public key to keyserver
gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID

# Export private key for CI/CD
gpg --export-secret-keys YOUR_KEY_ID | base64 > private-key.asc
```

#### 3. Configure Maven Settings

**File**: `~/.m2/settings.xml`

```xml
<settings>
  <servers>
    <server>
      <id>ossrh</id>
      <username>YOUR_SONATYPE_USERNAME</username>
      <password>YOUR_SONATYPE_PASSWORD</password>
    </server>
  </servers>

  <profiles>
    <profile>
      <id>release</id>
      <properties>
        <gpg.executable>gpg</gpg.executable>
        <gpg.passphrase>YOUR_GPG_PASSPHRASE</gpg.passphrase>
      </properties>
    </profile>
  </profiles>
</settings>
```

#### 4. Verify POM Configuration

**File**: `generated/java/pom.xml`

```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.llmforge</groupId>
  <artifactId>llm-forge</artifactId>
  <version>1.5.2</version>
  <packaging>jar</packaging>

  <name>LLM-Forge SDK</name>
  <description>Java SDK for LLM-Forge API</description>
  <url>https://github.com/llm-forge/llm-forge</url>

  <licenses>
    <license>
      <name>Apache License 2.0</name>
      <url>https://www.apache.org/licenses/LICENSE-2.0</url>
    </license>
  </licenses>

  <developers>
    <developer>
      <name>LLM-Forge Contributors</name>
      <email>hello@llm-forge.dev</email>
    </developer>
  </developers>

  <scm>
    <connection>scm:git:git://github.com/llm-forge/llm-forge.git</connection>
    <developerConnection>scm:git:ssh://github.com:llm-forge/llm-forge.git</developerConnection>
    <url>https://github.com/llm-forge/llm-forge/tree/main</url>
  </scm>

  <distributionManagement>
    <snapshotRepository>
      <id>ossrh</id>
      <url>https://oss.sonatype.org/content/repositories/snapshots</url>
    </snapshotRepository>
    <repository>
      <id>ossrh</id>
      <url>https://oss.sonatype.org/service/local/staging/deploy/maven2/</url>
    </repository>
  </distributionManagement>

  <build>
    <plugins>
      <!-- Source JAR -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-source-plugin</artifactId>
        <version>3.3.0</version>
        <executions>
          <execution>
            <id>attach-sources</id>
            <goals>
              <goal>jar-no-fork</goal>
            </goals>
          </execution>
        </executions>
      </plugin>

      <!-- Javadoc JAR -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-javadoc-plugin</artifactId>
        <version>3.6.0</version>
        <executions>
          <execution>
            <id>attach-javadocs</id>
            <goals>
              <goal>jar</goal>
            </goals>
          </execution>
        </executions>
      </plugin>

      <!-- GPG Signing -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-gpg-plugin</artifactId>
        <version>3.1.0</version>
        <executions>
          <execution>
            <id>sign-artifacts</id>
            <phase>verify</phase>
            <goals>
              <goal>sign</goal>
            </goals>
          </execution>
        </executions>
      </plugin>

      <!-- Nexus Staging -->
      <plugin>
        <groupId>org.sonatype.plugins</groupId>
        <artifactId>nexus-staging-maven-plugin</artifactId>
        <version>1.6.13</version>
        <extensions>true</extensions>
        <configuration>
          <serverId>ossrh</serverId>
          <nexusUrl>https://oss.sonatype.org/</nexusUrl>
          <autoReleaseAfterClose>true</autoReleaseAfterClose>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

### Publishing Process

#### Manual Publishing

```bash
cd generated/java

# 1. Build and test
mvn clean verify

# 2. Deploy to staging repository
mvn clean deploy -P release

# 3. Release from staging (automatic if autoReleaseAfterClose=true)
# Or manually via Nexus UI:
# https://oss.sonatype.org/#stagingRepositories

# Wait for sync to Maven Central (2-4 hours)
```

#### Verify Publication

```bash
# Check Maven Central
curl https://repo1.maven.org/maven2/com/llmforge/llm-forge/1.5.2/

# Test installation
mvn archetype:generate -DgroupId=com.example -DartifactId=test-llm-forge
cd test-llm-forge
# Add dependency to pom.xml
mvn compile
```

### Post-Publishing

- Artifacts synced to Maven Central within 2-4 hours
- Javadoc available on javadoc.io
- Package searchable on search.maven.org

### Unpublishing

**Maven Central does not allow deletion of released artifacts.**

Contact Sonatype support for critical issues (security vulnerabilities).

---

## Automated Publishing

### GitHub Actions Workflow

All publishing is automated through GitHub Actions when a version tag is pushed.

**Trigger Publishing**:

```bash
# 1. Bump version
./scripts/version.sh minor  # or major, patch

# 2. Push commit and tag
git push origin main
git push origin v1.5.2

# 3. Monitor workflow
# Visit: https://github.com/llm-forge/llm-forge/actions
```

**Workflow handles**:
- Building all SDKs
- Running all quality gates
- Publishing to all registries in parallel
- Creating GitHub release
- Updating documentation

### Environment Variables

Required secrets in GitHub:

```yaml
CARGO_TOKEN: <crates.io API token>
NPM_TOKEN: <npmjs.com API token>
PYPI_TOKEN: <PyPI API token>
NUGET_TOKEN: <nuget.org API key>
GPG_PRIVATE_KEY: <GPG private key for Java signing>
GPG_PASSPHRASE: <GPG key passphrase>
SONATYPE_USERNAME: <Sonatype JIRA username>
SONATYPE_PASSWORD: <Sonatype JIRA password>
```

---

## Post-Publishing Tasks

### 1. Verify All Registries

```bash
./scripts/verify-published.sh 1.5.2
```

### 2. Update Documentation

- [ ] Documentation site updated
- [ ] API reference regenerated
- [ ] Examples tested
- [ ] Migration guide published

### 3. Create GitHub Release

- [ ] Release notes posted
- [ ] Assets attached (if any)
- [ ] Pre-release flag set (if applicable)

### 4. Announce Release

- [ ] Post to GitHub Discussions
- [ ] Update project README
- [ ] Social media announcement
- [ ] Email notification to users (if applicable)
- [ ] Update changelog on website

### 5. Monitor

- [ ] Check download statistics
- [ ] Monitor issue tracker for bug reports
- [ ] Review user feedback
- [ ] Watch for security alerts

---

## Troubleshooting

### Common Issues

#### Issue: "Authentication Failed"

**Rust**:
```bash
cargo login
# Or check ~/.cargo/credentials.toml
```

**TypeScript**:
```bash
npm login
# Or check ~/.npmrc
```

**Python**:
```bash
poetry config pypi-token.pypi YOUR_TOKEN
# Or check ~/.pypirc
```

#### Issue: "Package Already Exists"

Cannot republish same version. Options:
1. Yank/deprecate existing version
2. Publish new patch version
3. Contact registry support (last resort)

#### Issue: "Signature Verification Failed" (Java)

```bash
# Verify GPG key
gpg --list-keys

# Re-sign artifacts
mvn clean verify -P release -Dgpg.skip=false

# Check settings.xml configuration
```

#### Issue: "Rate Limited"

Wait and retry. Implement exponential backoff in automation:

```bash
for i in {1..5}; do
  cargo publish && break || sleep $((2**i))
done
```

#### Issue: "Build Artifacts Missing"

Ensure build completed successfully before publishing:

```bash
# Rust
cargo build --release
ls target/package/

# TypeScript
npm run build
ls dist/

# Python
poetry build
ls dist/
```

---

## Emergency Procedures

### Critical Bug in Published Release

1. **Immediate Actions**:
   - Yank/deprecate affected version
   - Post warning on GitHub
   - Update documentation

2. **Fix and Release**:
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/v1.5.3 v1.5.2

   # Fix bug
   # ...

   # Bump version
   ./scripts/version.sh patch

   # Push and release
   git push origin v1.5.3
   ```

3. **Communication**:
   - Post incident report
   - Notify affected users
   - Document fix in changelog

### Incorrect Version Published

**Cannot change published version!**

1. Yank incorrect version
2. Publish corrected version with incremented number
3. Document mistake in release notes

---

## Best Practices

### Pre-Publishing

1. **Test in Staging**: Use test registries when available
2. **Dry Runs**: Always run `--dry-run` before publishing
3. **Peer Review**: Have another maintainer review release
4. **Automated Tests**: Rely on CI/CD for quality assurance

### During Publishing

1. **Publish Order**: Start with less critical languages first
2. **Monitor Logs**: Watch for errors during publish
3. **Parallel Publishing**: Use CI/CD to publish all in parallel
4. **Verify Immediately**: Check each registry after publish

### Post-Publishing

1. **Test Installation**: Install from registry on clean system
2. **Documentation**: Update docs before announcing
3. **Changelog**: Maintain detailed changelog
4. **Communication**: Announce through multiple channels

---

## References

- [crates.io Publishing Guide](https://doc.rust-lang.org/cargo/reference/publishing.html)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [PyPI Publishing Guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/)
- [NuGet Publishing Guide](https://learn.microsoft.com/en-us/nuget/nuget-org/publish-a-package)
- [Go Modules Publishing](https://go.dev/blog/publishing-go-modules)
- [Maven Central Publishing Guide](https://central.sonatype.org/publish/publish-guide/)
