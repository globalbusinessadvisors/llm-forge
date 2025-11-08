# LLM-Forge Build System Specifications

## Overview

This document provides detailed specifications for the build systems used across all six language ecosystems in LLM-Forge. It covers build tools, configurations, optimization strategies, and best practices.

---

## Build System Matrix

| Language   | Primary Tool | Alternative | Build Time Target | Artifact Size Target |
|------------|-------------|-------------|-------------------|----------------------|
| Rust       | Cargo       | -           | < 5 min           | < 10 MB              |
| TypeScript | npm/tsc     | pnpm/yarn   | < 3 min           | < 2 MB               |
| Python     | Poetry      | pip         | < 2 min           | < 5 MB               |
| C#         | dotnet CLI  | MSBuild     | < 4 min           | < 8 MB               |
| Go         | go CLI      | -           | < 2 min           | < 15 MB              |
| Java       | Maven       | Gradle      | < 5 min           | < 3 MB               |

---

## Rust Build System (Cargo)

### Configuration Files

#### Cargo.toml (Package Manifest)

**Location**: `generated/rust/Cargo.toml`

```toml
[package]
name = "llm-forge"
version = "1.5.2"
edition = "2021"
rust-version = "1.70.0"
authors = ["LLM-Forge Contributors"]
license = "Apache-2.0"
description = "Rust SDK for LLM-Forge API"
homepage = "https://github.com/llm-forge/llm-forge"
repository = "https://github.com/llm-forge/llm-forge"
documentation = "https://docs.rs/llm-forge"
readme = "README.md"
keywords = ["llm", "ai", "api", "sdk"]
categories = ["api-bindings", "web-programming::http-client"]
exclude = [
    "tests/fixtures/*",
    ".github/*",
    "*.log"
]

[lib]
name = "llm_forge"
path = "src/lib.rs"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
reqwest = { version = "0.11", features = ["json", "rustls-tls"], default-features = false }
thiserror = "1.0"
async-trait = "0.1"
url = "2.5"
chrono = { version = "0.4", features = ["serde"] }

[dev-dependencies]
tokio-test = "0.4"
mockito = "1.2"
wiremock = "0.5"

[features]
default = ["rustls-tls"]
rustls-tls = ["reqwest/rustls-tls"]
native-tls = ["reqwest/native-tls"]
blocking = []

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
strip = true

[profile.dev]
opt-level = 0
debug = true

[package.metadata.docs.rs]
all-features = true
rustdoc-args = ["--cfg", "docsrs"]
```

#### Cargo.lock (Dependency Lock)

**Location**: `generated/rust/Cargo.lock`

Auto-generated, commit to repository for reproducible builds.

#### .cargo/config.toml (Build Configuration)

**Location**: `generated/rust/.cargo/config.toml`

```toml
[build]
jobs = 4
rustflags = ["-D", "warnings"]

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

[net]
git-fetch-with-cli = true

[registry]
default = "crates-io"

[alias]
b = "build"
t = "test"
r = "run"
```

### Build Commands

#### Development Build

```bash
# Fast compilation, debug symbols
cargo build

# With specific features
cargo build --features "native-tls"

# All features
cargo build --all-features
```

#### Release Build

```bash
# Optimized build
cargo build --release

# With LTO (Link-Time Optimization)
RUSTFLAGS="-C lto=fat" cargo build --release

# Cross-compilation
cargo build --release --target x86_64-unknown-linux-musl
```

#### Incremental Build

```bash
# Enable incremental compilation (default in dev)
export CARGO_INCREMENTAL=1
cargo build
```

### Testing

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_name

# Run doc tests
cargo test --doc

# Run benchmarks
cargo bench
```

### Build Optimization

#### Compile Time Optimization

```toml
# Use newer linker
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

# Parallel codegen
[profile.dev]
codegen-units = 256

# Shared generics
[profile.release]
codegen-units = 1
```

#### Runtime Optimization

```toml
[profile.release]
opt-level = 3          # Maximum optimization
lto = "fat"            # Link-Time Optimization
codegen-units = 1      # Better optimization
panic = "abort"        # Smaller binary
strip = true           # Remove debug symbols
```

### Caching Strategy

```bash
# Cargo caches in ~/.cargo/
export CARGO_HOME=$HOME/.cargo

# Sccache (shared compilation cache)
export RUSTC_WRAPPER=sccache
cargo build
```

---

## TypeScript Build System (npm/tsc)

### Configuration Files

#### package.json

**Location**: `generated/typescript/package.json`

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
    "build": "npm run build:cjs && npm run build:esm",
    "build:cjs": "tsc -p tsconfig.json",
    "build:esm": "tsc -p tsconfig.esm.json",
    "build:watch": "tsc -p tsconfig.json --watch",
    "clean": "rm -rf dist",
    "prebuild": "npm run clean",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "docs": "typedoc --out docs/api src/index.ts",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": ["llm", "ai", "api", "sdk", "typescript"],
  "author": "LLM-Forge Contributors",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/llm-forge/llm-forge.git"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "jest": "^29.7.0",
    "prettier": "^3.1.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typedoc": "^0.25.0",
    "typescript": "^5.3.0"
  }
}
```

#### tsconfig.json (CommonJS)

**Location**: `generated/typescript/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### tsconfig.esm.json (ES Modules)

**Location**: `generated/typescript/tsconfig.esm.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ES2020",
    "outDir": "./dist",
    "declaration": false
  }
}
```

### Build Commands

#### Development Build

```bash
# Build both CJS and ESM
npm run build

# Watch mode
npm run build:watch

# Type check only (no emit)
npm run type-check
```

#### Production Build

```bash
# Clean build
npm run clean
npm run build

# With optimization
npm run build -- --minify
```

### Build Optimization

#### TypeScript Compiler Options

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "composite": false,
    "removeComments": true,
    "importHelpers": true
  }
}
```

#### Bundle Size Optimization

```bash
# Use esbuild for faster builds
npm install -D esbuild

# Add to package.json scripts:
"build:fast": "esbuild src/index.ts --bundle --outfile=dist/index.js --platform=node"
```

---

## Python Build System (Poetry)

### Configuration Files

#### pyproject.toml

**Location**: `generated/python/pyproject.toml`

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
packages = [{include = "llm_forge", from = "src"}]

[tool.poetry.dependencies]
python = "^3.8"
httpx = "^0.25.0"
pydantic = "^2.5"
typing-extensions = "^4.8"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4"
pytest-cov = "^4.1"
pytest-asyncio = "^0.21"
black = "^23.12"
ruff = "^0.1"
mypy = "^1.7"
sphinx = "^7.2"
sphinx-rtd-theme = "^2.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 100
target-version = ['py38', 'py39', 'py310', 'py311']

[tool.ruff]
line-length = 100
select = ["E", "F", "W", "C90", "I", "N", "UP", "S", "B", "A"]
ignore = []
target-version = "py38"

[tool.mypy]
python_version = "3.8"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --strict-markers --cov=llm_forge --cov-report=term-missing"

[tool.coverage.run]
branch = true
source = ["src"]

[tool.coverage.report]
precision = 2
fail_under = 80
show_missing = true
```

### Build Commands

#### Development Setup

```bash
# Install dependencies
poetry install

# Install with dev dependencies
poetry install --with dev

# Update dependencies
poetry update
```

#### Build Distribution

```bash
# Build wheel and sdist
poetry build

# Output: dist/llm_forge-1.5.2-py3-none-any.whl
#         dist/llm_forge-1.5.2.tar.gz

# Build wheel only
poetry build -f wheel
```

### Build Optimization

#### Reduce Package Size

```toml
# Exclude unnecessary files
[tool.poetry]
exclude = [
    "tests/**",
    "docs/**",
    "*.pyc",
    "__pycache__",
    ".pytest_cache"
]
```

#### Faster Dependency Resolution

```bash
# Use experimental installer
poetry config experimental.new-installer true

# Use parallel installation
poetry config installer.parallel true
```

---

## C# Build System (dotnet CLI)

### Configuration Files

#### LLMForge.csproj

**Location**: `generated/csharp/LLMForge.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <!-- Target Framework -->
    <TargetFramework>net6.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>

    <!-- Package Information -->
    <PackageId>LLMForge</PackageId>
    <Version>1.5.2</Version>
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

    <!-- Build Configuration -->
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <DocumentationFile>bin\$(Configuration)\$(TargetFramework)\$(AssemblyName).xml</DocumentationFile>
    <NoWarn>$(NoWarn);1591</NoWarn>

    <!-- Code Analysis -->
    <EnableNETAnalyzers>true</EnableNETAnalyzers>
    <AnalysisLevel>latest</AnalysisLevel>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>

    <!-- Optimization -->
    <Optimize>true</Optimize>
    <DebugType>embedded</DebugType>
  </PropertyGroup>

  <PropertyGroup Condition="'$(Configuration)' == 'Release'">
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <Deterministic>true</Deterministic>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="System.Net.Http.Json" Version="8.0.0" />
    <PackageReference Include="System.Text.Json" Version="8.0.0" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="StyleCop.Analyzers" Version="1.2.0-beta.435">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <None Include="README.md" Pack="true" PackagePath="/" />
  </ItemGroup>
</Project>
```

#### Directory.Build.props

**Location**: `generated/csharp/Directory.Build.props`

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>
  </PropertyGroup>
</Project>
```

### Build Commands

#### Development Build

```bash
# Restore dependencies
dotnet restore

# Build
dotnet build

# Build with verbosity
dotnet build --verbosity detailed
```

#### Release Build

```bash
# Release configuration
dotnet build --configuration Release

# With no restore (faster)
dotnet build --configuration Release --no-restore

# Package
dotnet pack --configuration Release --output ./artifacts
```

### Build Optimization

#### Faster Builds

```xml
<PropertyGroup>
  <!-- Parallel build -->
  <BuildInParallel>true</BuildInParallel>

  <!-- Incremental build -->
  <UseCommonOutputDirectory>false</UseCommonOutputDirectory>
</PropertyGroup>
```

#### Smaller Artifacts

```xml
<PropertyGroup Condition="'$(Configuration)' == 'Release'">
  <DebugSymbols>false</DebugSymbols>
  <DebugType>none</DebugType>
  <Optimize>true</Optimize>
</PropertyGroup>
```

---

## Go Build System

### Configuration Files

#### go.mod

**Location**: `generated/go/go.mod`

```go
module github.com/llm-forge/llm-forge

go 1.21

require (
    github.com/google/uuid v1.5.0
    github.com/stretchr/testify v1.8.4
)

require (
    github.com/davecgh/go-spew v1.1.1 // indirect
    github.com/pmezard/go-difflib v1.0.0 // indirect
    gopkg.in/yaml.v3 v3.0.1 // indirect
)
```

#### go.sum (Dependency Checksums)

Auto-generated, commit to repository.

### Build Commands

#### Development Build

```bash
# Build
go build ./...

# Build specific package
go build -o bin/llm-forge cmd/main.go

# Install
go install ./...
```

#### Release Build

```bash
# Build with optimizations
go build -ldflags="-s -w" -o bin/llm-forge

# Cross-compile
GOOS=linux GOARCH=amd64 go build -o bin/llm-forge-linux-amd64
GOOS=darwin GOARCH=arm64 go build -o bin/llm-forge-darwin-arm64
GOOS=windows GOARCH=amd64 go build -o bin/llm-forge-windows-amd64.exe
```

### Build Optimization

#### Build Flags

```bash
# Remove debug info and symbol table
go build -ldflags="-s -w"

# Trim paths for reproducible builds
go build -trimpath

# Disable CGO for static binary
CGO_ENABLED=0 go build

# Combined
CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/llm-forge
```

#### Module Management

```bash
# Tidy dependencies
go mod tidy

# Vendor dependencies
go mod vendor

# Verify dependencies
go mod verify
```

---

## Java Build System (Maven)

### Configuration Files

#### pom.xml

**Location**: `generated/java/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.llmforge</groupId>
  <artifactId>llm-forge</artifactId>
  <version>1.5.2</version>
  <packaging>jar</packaging>

  <name>LLM-Forge SDK</name>
  <description>Java SDK for LLM-Forge API</description>
  <url>https://github.com/llm-forge/llm-forge</url>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <junit.version>5.10.1</junit.version>
  </properties>

  <dependencies>
    <!-- HTTP Client -->
    <dependency>
      <groupId>com.squareup.okhttp3</groupId>
      <artifactId>okhttp</artifactId>
      <version>4.12.0</version>
    </dependency>

    <!-- JSON -->
    <dependency>
      <groupId>com.google.code.gson</groupId>
      <artifactId>gson</artifactId>
      <version>2.10.1</version>
    </dependency>

    <!-- Testing -->
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>${junit.version}</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <!-- Compiler -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.11.0</version>
        <configuration>
          <source>17</source>
          <target>17</target>
          <compilerArgs>
            <arg>-parameters</arg>
            <arg>-Xlint:all</arg>
          </compilerArgs>
        </configuration>
      </plugin>

      <!-- Testing -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.2.2</version>
      </plugin>

      <!-- JAR -->
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-jar-plugin</artifactId>
        <version>3.3.0</version>
        <configuration>
          <archive>
            <manifest>
              <addDefaultImplementationEntries>true</addDefaultImplementationEntries>
              <addDefaultSpecificationEntries>true</addDefaultSpecificationEntries>
            </manifest>
          </archive>
        </configuration>
      </plugin>

      <!-- Code Coverage -->
      <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
        <version>0.8.11</version>
        <executions>
          <execution>
            <goals>
              <goal>prepare-agent</goal>
            </goals>
          </execution>
          <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
              <goal>report</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
</project>
```

### Build Commands

#### Development Build

```bash
# Compile
mvn compile

# Test
mvn test

# Package
mvn package
```

#### Release Build

```bash
# Clean and package
mvn clean package

# Skip tests (faster)
mvn clean package -DskipTests

# With all checks
mvn clean verify
```

### Build Optimization

#### Faster Builds

```xml
<properties>
  <!-- Parallel builds -->
  <maven.threads>4</maven.threads>

  <!-- Incremental compilation -->
  <maven.compiler.useIncrementalCompilation>true</maven.compiler.useIncrementalCompilation>
</properties>
```

Run with:
```bash
mvn -T 4 clean install
```

#### Smaller JARs

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-shade-plugin</artifactId>
  <version>3.5.1</version>
  <configuration>
    <minimizeJar>true</minimizeJar>
  </configuration>
</plugin>
```

---

## Cross-Language Build Scripts

### Master Build Script

**File**: `/workspaces/llm-forge/scripts/build-all.sh`

```bash
#!/bin/bash
set -e

echo "Building all SDKs..."

# Rust
echo "Building Rust SDK..."
cd generated/rust
cargo build --release
cd ../..

# TypeScript
echo "Building TypeScript SDK..."
cd generated/typescript
npm ci
npm run build
cd ../..

# Python
echo "Building Python SDK..."
cd generated/python
poetry install
poetry build
cd ../..

# C#
echo "Building C# SDK..."
cd generated/csharp
dotnet restore
dotnet build --configuration Release
cd ../..

# Go
echo "Building Go SDK..."
cd generated/go
go build ./...
cd ../..

# Java
echo "Building Java SDK..."
cd generated/java
mvn clean package -DskipTests
cd ../..

echo "All SDKs built successfully!"
```

### Master Test Script

**File**: `/workspaces/llm-forge/scripts/test-all.sh`

```bash
#!/bin/bash
set -e

echo "Testing all SDKs..."

# Rust
cd generated/rust && cargo test && cd ../..

# TypeScript
cd generated/typescript && npm test && cd ../..

# Python
cd generated/python && poetry run pytest && cd ../..

# C#
cd generated/csharp && dotnet test && cd ../..

# Go
cd generated/go && go test ./... && cd ../..

# Java
cd generated/java && mvn test && cd ../..

echo "All tests passed!"
```

---

## Performance Benchmarks

### Target Build Times

| Language   | Clean Build | Incremental | With Tests |
|------------|-------------|-------------|------------|
| Rust       | 4m 30s      | 45s         | 5m 30s     |
| TypeScript | 2m 15s      | 20s         | 3m 00s     |
| Python     | 1m 30s      | 10s         | 2m 30s     |
| C#         | 3m 45s      | 30s         | 4m 45s     |
| Go         | 1m 45s      | 15s         | 2m 15s     |
| Java       | 4m 15s      | 40s         | 5m 15s     |

### Optimization Tips

1. **Use Caching**: Cache dependencies between builds
2. **Parallel Builds**: Enable multi-core compilation
3. **Incremental Compilation**: Only rebuild changed files
4. **Skip Unnecessary Steps**: Skip docs generation in CI
5. **Optimize Dependencies**: Minimize dependency count

---

## References

- [Cargo Book](https://doc.rust-lang.org/cargo/)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [dotnet CLI Reference](https://learn.microsoft.com/en-us/dotnet/core/tools/)
- [Go Build Command](https://go.dev/cmd/go/#hdr-Compile_packages_and_dependencies)
- [Maven Documentation](https://maven.apache.org/guides/)
