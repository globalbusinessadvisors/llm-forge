# LLM-Forge CI/CD Workflow Specifications

## Overview

This document provides detailed specifications for all GitHub Actions workflows used in LLM-Forge's CI/CD pipeline. Each workflow is designed to be modular, reusable, and maintainable.

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW TRIGGERS                            │
├─────────────────────────────────────────────────────────────────────┤
│  Push to main     │  Pull Request  │  Tag Push  │  Schedule         │
└────────┬──────────┴────────┬───────┴─────┬──────┴────────┬──────────┘
         │                   │             │               │
         ▼                   ▼             ▼               ▼
   ┌─────────┐        ┌──────────┐   ┌─────────┐   ┌──────────┐
   │  Main   │        │    PR    │   │ Release │   │ Scheduled │
   │  Build  │        │Validation│   │ Workflow│   │  Tasks   │
   └─────────┘        └──────────┘   └─────────┘   └──────────┘
         │                   │             │               │
         └───────────────┬───┴─────────────┴───────────────┘
                         ▼
              ┌────────────────────┐
              │  Reusable Workflows │
              ├────────────────────┤
              │  - build-sdk       │
              │  - run-tests       │
              │  - quality-check   │
              │  - publish-sdk     │
              └────────────────────┘
```

---

## Reusable Workflows

### 1. Build SDK Workflow

**File**: `.github/workflows/reusable-build-sdk.yml`

```yaml
name: Build SDK (Reusable)

on:
  workflow_call:
    inputs:
      language:
        required: true
        type: string
        description: 'Language to build (rust, typescript, python, csharp, go, java)'
      working-directory:
        required: true
        type: string
        description: 'Working directory for the SDK'
      os:
        required: false
        type: string
        default: 'ubuntu-latest'
        description: 'Operating system to run on'
    outputs:
      build-success:
        description: 'Whether the build succeeded'
        value: ${{ jobs.build.outputs.success }}

jobs:
  build:
    runs-on: ${{ inputs.os }}
    outputs:
      success: ${{ steps.build.outcome == 'success' }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup language environment
        uses: ./.github/actions/setup-language
        with:
          language: ${{ inputs.language }}

      - name: Cache dependencies
        uses: ./.github/actions/cache-dependencies
        with:
          language: ${{ inputs.language }}
          working-directory: ${{ inputs.working-directory }}

      - name: Install dependencies
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo fetch --locked
              ;;
            typescript)
              npm ci --prefer-offline
              ;;
            python)
              poetry install --no-root --sync
              ;;
            csharp)
              dotnet restore --locked-mode
              ;;
            go)
              go mod download
              go mod verify
              ;;
            java)
              mvn dependency:go-offline
              ;;
          esac

      - name: Build SDK
        id: build
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo build --release --all-features
              ;;
            typescript)
              npm run build
              ;;
            python)
              poetry build
              ;;
            csharp)
              dotnet build --configuration Release --no-restore
              ;;
            go)
              go build -v ./...
              ;;
            java)
              mvn compile -DskipTests
              ;;
          esac

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ inputs.language }}-build-${{ inputs.os }}
          path: |
            ${{ inputs.working-directory }}/target/
            ${{ inputs.working-directory }}/dist/
            ${{ inputs.working-directory }}/build/
            ${{ inputs.working-directory }}/bin/
          retention-days: 7
```

### 2. Run Tests Workflow

**File**: `.github/workflows/reusable-run-tests.yml`

```yaml
name: Run Tests (Reusable)

on:
  workflow_call:
    inputs:
      language:
        required: true
        type: string
      working-directory:
        required: true
        type: string
      test-type:
        required: false
        type: string
        default: 'all'
        description: 'Test type: unit, integration, or all'
      coverage-threshold:
        required: false
        type: number
        default: 80
        description: 'Minimum code coverage percentage'

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup language environment
        uses: ./.github/actions/setup-language
        with:
          language: ${{ inputs.language }}

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: ${{ inputs.language }}-build-ubuntu-latest
          path: ${{ inputs.working-directory }}

      - name: Run unit tests
        if: inputs.test-type == 'unit' || inputs.test-type == 'all'
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo test --all-features
              ;;
            typescript)
              npm test -- --coverage
              ;;
            python)
              poetry run pytest tests/unit -v --cov --cov-report=xml
              ;;
            csharp)
              dotnet test --no-build --configuration Release --collect:"XPlat Code Coverage"
              ;;
            go)
              go test -v -race -coverprofile=coverage.out ./...
              ;;
            java)
              mvn test jacoco:report
              ;;
          esac

      - name: Run integration tests
        if: inputs.test-type == 'integration' || inputs.test-type == 'all'
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo test --test integration
              ;;
            typescript)
              npm run test:integration
              ;;
            python)
              poetry run pytest tests/integration -v
              ;;
            csharp)
              dotnet test --filter Category=Integration
              ;;
            go)
              go test -v -tags=integration ./...
              ;;
            java)
              mvn verify -P integration-tests
              ;;
          esac

      - name: Check coverage threshold
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo tarpaulin --out Xml
              ;;
            typescript)
              # Jest outputs coverage automatically
              ;;
            python)
              poetry run coverage report --fail-under=${{ inputs.coverage-threshold }}
              ;;
            csharp)
              reportgenerator -reports:**/coverage.cobertura.xml -targetdir:./coverage
              ;;
            go)
              go tool cover -func=coverage.out | grep total | awk '{if ($3+0 < ${{ inputs.coverage-threshold }}) exit 1}'
              ;;
            java)
              mvn jacoco:check -Djacoco.coverage.minimum=${{ inputs.coverage-threshold }}
              ;;
          esac

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          files: |
            ${{ inputs.working-directory }}/coverage.xml
            ${{ inputs.working-directory }}/coverage.out
            ${{ inputs.working-directory }}/target/site/jacoco/jacoco.xml
          flags: ${{ inputs.language }}
          name: ${{ inputs.language }}-coverage
```

### 3. Quality Check Workflow

**File**: `.github/workflows/reusable-quality-check.yml`

```yaml
name: Quality Check (Reusable)

on:
  workflow_call:
    inputs:
      language:
        required: true
        type: string
      working-directory:
        required: true
        type: string

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup language environment
        uses: ./.github/actions/setup-language
        with:
          language: ${{ inputs.language }}

      - name: Check formatting
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo fmt -- --check
              ;;
            typescript)
              npm run format:check
              ;;
            python)
              poetry run black --check .
              ;;
            csharp)
              dotnet format --verify-no-changes
              ;;
            go)
              test -z "$(gofmt -l .)"
              ;;
            java)
              mvn spotless:check
              ;;
          esac

      - name: Run linting
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo clippy --all-targets --all-features -- -D warnings
              ;;
            typescript)
              npm run lint
              ;;
            python)
              poetry run ruff check .
              ;;
            csharp)
              dotnet build /p:EnforceCodeStyleInBuild=true
              ;;
            go)
              golangci-lint run --timeout 5m
              ;;
            java)
              mvn checkstyle:check
              mvn pmd:check
              ;;
          esac

      - name: Type checking
        if: inputs.language == 'typescript' || inputs.language == 'python'
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            typescript)
              npm run type-check
              ;;
            python)
              poetry run mypy src --strict
              ;;
          esac

      - name: Security scanning
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo audit --deny warnings
              ;;
            typescript)
              npm audit --audit-level=high
              ;;
            python)
              poetry run safety check
              poetry run pip-audit
              ;;
            csharp)
              dotnet list package --vulnerable --include-transitive
              ;;
            go)
              govulncheck ./...
              ;;
            java)
              mvn org.owasp:dependency-check-maven:check
              ;;
          esac
```

### 4. Publish SDK Workflow

**File**: `.github/workflows/reusable-publish-sdk.yml`

```yaml
name: Publish SDK (Reusable)

on:
  workflow_call:
    inputs:
      language:
        required: true
        type: string
      working-directory:
        required: true
        type: string
      dry-run:
        required: false
        type: boolean
        default: false
    secrets:
      registry-token:
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup language environment
        uses: ./.github/actions/setup-language
        with:
          language: ${{ inputs.language }}

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: ${{ inputs.language }}-build-ubuntu-latest
          path: ${{ inputs.working-directory }}

      - name: Verify version consistency
        run: |
          VERSION=$(cat VERSION)
          echo "Publishing version: $VERSION"

          # Verify version matches in package file
          case "${{ inputs.language }}" in
            rust)
              grep -q "version = \"$VERSION\"" ${{ inputs.working-directory }}/Cargo.toml
              ;;
            typescript)
              grep -q "\"version\": \"$VERSION\"" ${{ inputs.working-directory }}/package.json
              ;;
            python)
              grep -q "version = \"$VERSION\"" ${{ inputs.working-directory }}/pyproject.toml
              ;;
            csharp)
              grep -q "<Version>$VERSION</Version>" ${{ inputs.working-directory }}/LLMForge.csproj
              ;;
            java)
              grep -q "<version>$VERSION</version>" ${{ inputs.working-directory }}/pom.xml
              ;;
          esac

      - name: Dry run publish
        if: inputs.dry-run
        working-directory: ${{ inputs.working-directory }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo publish --dry-run
              ;;
            typescript)
              npm publish --dry-run
              ;;
            python)
              poetry publish --dry-run
              ;;
            csharp)
              echo "Dry run not supported for NuGet"
              ;;
            go)
              echo "Dry run not applicable for Go (uses git tags)"
              ;;
            java)
              echo "Dry run not supported for Maven"
              ;;
          esac

      - name: Publish to registry
        if: "!inputs.dry-run"
        working-directory: ${{ inputs.working-directory }}
        env:
          REGISTRY_TOKEN: ${{ secrets.registry-token }}
        run: |
          case "${{ inputs.language }}" in
            rust)
              cargo publish --token $REGISTRY_TOKEN
              ;;
            typescript)
              echo "//registry.npmjs.org/:_authToken=$REGISTRY_TOKEN" > ~/.npmrc
              npm publish --access public
              ;;
            python)
              poetry publish --username __token__ --password $REGISTRY_TOKEN
              ;;
            csharp)
              dotnet nuget push artifacts/*.nupkg \
                --api-key $REGISTRY_TOKEN \
                --source https://api.nuget.org/v3/index.json
              ;;
            go)
              # Go publishing handled by git tag push
              echo "Go module published via git tag"
              ;;
            java)
              mvn deploy -P release -Dgpg.skip=false
              ;;
          esac

      - name: Verify publication
        if: "!inputs.dry-run"
        run: |
          VERSION=$(cat VERSION)
          sleep 60  # Wait for registry to index

          case "${{ inputs.language }}" in
            rust)
              curl -f https://crates.io/api/v1/crates/llm-forge/$VERSION
              ;;
            typescript)
              npm view llm-forge@$VERSION version
              ;;
            python)
              pip index versions llm-forge | grep $VERSION
              ;;
            csharp)
              curl -f https://api.nuget.org/v3/registration5-gz-semver2/llmforge/$VERSION/index.json
              ;;
            go)
              curl -f https://pkg.go.dev/github.com/llm-forge/llm-forge@v$VERSION
              ;;
            java)
              # Maven Central sync can take hours
              echo "Maven Central sync pending"
              ;;
          esac
```

---

## Composite Actions

### Setup Language Environment

**File**: `.github/actions/setup-language/action.yml`

```yaml
name: Setup Language Environment
description: Setup language-specific tools and environment

inputs:
  language:
    description: 'Language to setup (rust, typescript, python, csharp, go, java)'
    required: true

runs:
  using: composite
  steps:
    - name: Setup Rust
      if: inputs.language == 'rust'
      uses: actions-rust-lang/setup-rust-toolchain@v1
      with:
        toolchain: stable
        components: rustfmt, clippy

    - name: Setup Node.js
      if: inputs.language == 'typescript'
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: generated/typescript/package-lock.json

    - name: Setup Python
      if: inputs.language == 'python'
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
        cache: 'poetry'

    - name: Install Poetry
      if: inputs.language == 'python'
      shell: bash
      run: |
        curl -sSL https://install.python-poetry.org | python3 -
        echo "$HOME/.local/bin" >> $GITHUB_PATH

    - name: Setup .NET
      if: inputs.language == 'csharp'
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '8.0'

    - name: Setup Go
      if: inputs.language == 'go'
      uses: actions/setup-go@v5
      with:
        go-version: '1.21'
        cache-dependency-path: generated/go/go.sum

    - name: Setup Java
      if: inputs.language == 'java'
      uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '17'
        cache: 'maven'
```

### Cache Dependencies

**File**: `.github/actions/cache-dependencies/action.yml`

```yaml
name: Cache Dependencies
description: Cache language-specific dependencies

inputs:
  language:
    description: 'Language (rust, typescript, python, csharp, go, java)'
    required: true
  working-directory:
    description: 'Working directory'
    required: true

runs:
  using: composite
  steps:
    - name: Cache Rust dependencies
      if: inputs.language == 'rust'
      uses: actions/cache@v4
      with:
        path: |
          ~/.cargo/registry/index/
          ~/.cargo/registry/cache/
          ~/.cargo/git/db/
          ${{ inputs.working-directory }}/target/
        key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
        restore-keys: |
          ${{ runner.os }}-cargo-

    - name: Cache npm dependencies
      if: inputs.language == 'typescript'
      uses: actions/cache@v4
      with:
        path: ~/.npm
        key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-npm-

    - name: Cache Poetry dependencies
      if: inputs.language == 'python'
      uses: actions/cache@v4
      with:
        path: ~/.cache/pypoetry
        key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
        restore-keys: |
          ${{ runner.os }}-poetry-

    - name: Cache NuGet packages
      if: inputs.language == 'csharp'
      uses: actions/cache@v4
      with:
        path: ~/.nuget/packages
        key: ${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}
        restore-keys: |
          ${{ runner.os }}-nuget-

    - name: Cache Go modules
      if: inputs.language == 'go'
      uses: actions/cache@v4
      with:
        path: ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
        restore-keys: |
          ${{ runner.os }}-go-

    - name: Cache Maven dependencies
      if: inputs.language == 'java'
      uses: actions/cache@v4
      with:
        path: ~/.m2/repository
        key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
        restore-keys: |
          ${{ runner.os }}-maven-
```

---

## Main Workflows

### Pull Request Validation

**File**: `.github/workflows/pr-validation.yml`

```yaml
name: PR Validation

on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'generated/**'
      - 'specs/**'
      - 'templates/**'
      - '.github/workflows/**'

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      rust: ${{ steps.filter.outputs.rust }}
      typescript: ${{ steps.filter.outputs.typescript }}
      python: ${{ steps.filter.outputs.python }}
      csharp: ${{ steps.filter.outputs.csharp }}
      go: ${{ steps.filter.outputs.go }}
      java: ${{ steps.filter.outputs.java }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            rust:
              - 'generated/rust/**'
              - 'specs/**'
            typescript:
              - 'generated/typescript/**'
              - 'specs/**'
            python:
              - 'generated/python/**'
              - 'specs/**'
            csharp:
              - 'generated/csharp/**'
              - 'specs/**'
            go:
              - 'generated/go/**'
              - 'specs/**'
            java:
              - 'generated/java/**'
              - 'specs/**'

  breaking-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check OpenAPI Breaking Changes
        uses: oasdiff/oasdiff-action@v0.0.19
        with:
          base: ${{ github.event.pull_request.base.sha }}:specs/openapi.yaml
          revision: HEAD:specs/openapi.yaml
          format: markdown
          fail-on: ERR

      - name: Comment PR with breaking changes
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ **Breaking changes detected!** Please review the changes and ensure version is bumped correctly.'
            })

  build-rust:
    needs: detect-changes
    if: needs.detect-changes.outputs.rust == 'true'
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    uses: ./.github/workflows/reusable-build-sdk.yml
    with:
      language: rust
      working-directory: generated/rust
      os: ${{ matrix.os }}

  test-rust:
    needs: build-rust
    uses: ./.github/workflows/reusable-run-tests.yml
    with:
      language: rust
      working-directory: generated/rust
      test-type: all

  quality-rust:
    needs: detect-changes
    if: needs.detect-changes.outputs.rust == 'true'
    uses: ./.github/workflows/reusable-quality-check.yml
    with:
      language: rust
      working-directory: generated/rust

  # Repeat for other languages...
  build-typescript:
    needs: detect-changes
    if: needs.detect-changes.outputs.typescript == 'true'
    uses: ./.github/workflows/reusable-build-sdk.yml
    with:
      language: typescript
      working-directory: generated/typescript

  test-typescript:
    needs: build-typescript
    uses: ./.github/workflows/reusable-run-tests.yml
    with:
      language: typescript
      working-directory: generated/typescript

  quality-typescript:
    needs: detect-changes
    if: needs.detect-changes.outputs.typescript == 'true'
    uses: ./.github/workflows/reusable-quality-check.yml
    with:
      language: typescript
      working-directory: generated/typescript

  # ... (similar jobs for python, csharp, go, java)

  pr-summary:
    needs: [build-rust, test-rust, quality-rust, build-typescript, test-typescript, quality-typescript]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Generate PR summary
        uses: actions/github-script@v7
        with:
          script: |
            const results = {
              rust: '${{ needs.test-rust.result }}',
              typescript: '${{ needs.test-typescript.result }}',
              // ... other languages
            };

            let summary = '## CI/CD Summary\n\n';
            for (const [lang, result] of Object.entries(results)) {
              const emoji = result === 'success' ? '✅' : result === 'skipped' ? '⏭️' : '❌';
              summary += `${emoji} **${lang}**: ${result}\n`;
            }

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
```

### Release Workflow

**File**: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  validate-tag:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.get-version.outputs.version }}
    steps:
      - uses: actions/checkout@v4

      - name: Get version from tag
        id: get-version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Verify version matches VERSION file
        run: |
          FILE_VERSION=$(cat VERSION)
          TAG_VERSION=${{ steps.get-version.outputs.version }}
          if [ "$FILE_VERSION" != "$TAG_VERSION" ]; then
            echo "Version mismatch: VERSION file has $FILE_VERSION but tag is $TAG_VERSION"
            exit 1
          fi

  build-all:
    needs: validate-tag
    strategy:
      matrix:
        language: [rust, typescript, python, csharp, go, java]
    uses: ./.github/workflows/reusable-build-sdk.yml
    with:
      language: ${{ matrix.language }}
      working-directory: generated/${{ matrix.language }}

  test-all:
    needs: build-all
    strategy:
      matrix:
        language: [rust, typescript, python, csharp, go, java]
    uses: ./.github/workflows/reusable-run-tests.yml
    with:
      language: ${{ matrix.language }}
      working-directory: generated/${{ matrix.language }}
      test-type: all

  quality-all:
    needs: validate-tag
    strategy:
      matrix:
        language: [rust, typescript, python, csharp, go, java]
    uses: ./.github/workflows/reusable-quality-check.yml
    with:
      language: ${{ matrix.language }}
      working-directory: generated/${{ matrix.language }}

  publish-all:
    needs: [test-all, quality-all]
    strategy:
      matrix:
        language: [rust, typescript, python, csharp, go, java]
      fail-fast: false
    uses: ./.github/workflows/reusable-publish-sdk.yml
    with:
      language: ${{ matrix.language }}
      working-directory: generated/${{ matrix.language }}
      dry-run: false
    secrets:
      registry-token: ${{ secrets[format('{0}_TOKEN', matrix.language)] }}

  create-github-release:
    needs: publish-all
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Extract changelog
        id: changelog
        run: |
          VERSION=${{ needs.validate-tag.outputs.version }}
          CHANGELOG=$(awk "/## \[$VERSION\]/,/## \[/{if(/## \[/ && !/## \[$VERSION\]/)exit;print}" CHANGELOG.md)
          echo "changelog<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGELOG" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ needs.validate-tag.outputs.version }}
          body: ${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: ${{ contains(github.ref, 'alpha') || contains(github.ref, 'beta') || contains(github.ref, 'rc') }}

  notify:
    needs: create-github-release
    runs-on: ubuntu-latest
    steps:
      - name: Send notification
        uses: actions/github-script@v7
        with:
          script: |
            // Post to GitHub Discussions
            // Send webhook notifications
            // Update documentation sites
            console.log('Release ${{ needs.validate-tag.outputs.version }} published successfully!');
```

### Scheduled Tasks

**File**: `.github/workflows/scheduled.yml`

```yaml
name: Scheduled Tasks

on:
  schedule:
    # Daily at 2 AM UTC
    - cron: '0 2 * * *'
    # Weekly on Monday at 3 AM UTC
    - cron: '0 3 * * 1'
    # Monthly on 1st at 4 AM UTC
    - cron: '0 4 1 * *'
  workflow_dispatch:

jobs:
  daily-security-scan:
    if: github.event.schedule == '0 2 * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: [rust, typescript, python, csharp, go, java]
    steps:
      - uses: actions/checkout@v4

      - name: Setup language
        uses: ./.github/actions/setup-language
        with:
          language: ${{ matrix.language }}

      - name: Run security scan
        working-directory: generated/${{ matrix.language }}
        run: |
          case "${{ matrix.language }}" in
            rust)
              cargo audit
              ;;
            typescript)
              npm audit
              ;;
            python)
              poetry run safety check
              ;;
            csharp)
              dotnet list package --vulnerable
              ;;
            go)
              govulncheck ./...
              ;;
            java)
              mvn org.owasp:dependency-check-maven:check
              ;;
          esac

      - name: Create security issue if vulnerabilities found
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔒 Security vulnerabilities found in ${{ matrix.language }} SDK',
              body: 'Daily security scan detected vulnerabilities. Please review and update dependencies.',
              labels: ['security', '${{ matrix.language }}', 'dependencies']
            });

  weekly-regeneration:
    if: github.event.schedule == '0 3 * * 1' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Regenerate all SDKs
        run: ./scripts/generate.sh --all

      - name: Create PR if changes detected
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore: weekly SDK regeneration'
          title: 'Weekly SDK Regeneration'
          body: 'Automated regeneration of all SDKs from API specifications'
          branch: automated/weekly-regen
          labels: automated

  monthly-dependency-update:
    if: github.event.schedule == '0 4 1 * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: [rust, typescript, python, csharp, go, java]
    steps:
      - uses: actions/checkout@v4

      - name: Setup language
        uses: ./.github/actions/setup-language
        with:
          language: ${{ matrix.language }}

      - name: Update dependencies
        working-directory: generated/${{ matrix.language }}
        run: |
          case "${{ matrix.language }}" in
            rust)
              cargo update
              ;;
            typescript)
              npm update
              ;;
            python)
              poetry update
              ;;
            csharp)
              dotnet outdated --upgrade
              ;;
            go)
              go get -u ./...
              go mod tidy
              ;;
            java)
              mvn versions:use-latest-releases
              ;;
          esac

      - name: Create PR with updates
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore: update ${{ matrix.language }} dependencies'
          title: 'Monthly Dependency Update - ${{ matrix.language }}'
          body: 'Automated monthly dependency updates for ${{ matrix.language }} SDK'
          branch: automated/deps-${{ matrix.language }}
          labels: ['dependencies', '${{ matrix.language }}']
```

---

## Workflow Optimization

### Caching Strategy

```yaml
# Cargo cache (Rust)
- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/registry/index/
      ~/.cargo/registry/cache/
      ~/.cargo/git/db/
      target/
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
    restore-keys: ${{ runner.os }}-cargo-

# Node modules cache (TypeScript)
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: ${{ runner.os }}-npm-

# Poetry cache (Python)
- uses: actions/cache@v4
  with:
    path: ~/.cache/pypoetry
    key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
    restore-keys: ${{ runner.os }}-poetry-
```

### Parallel Execution

```yaml
jobs:
  build-all-languages:
    strategy:
      matrix:
        language: [rust, typescript, python, csharp, go, java]
        os: [ubuntu-latest, macos-latest, windows-latest]
      fail-fast: false
      max-parallel: 6
```

### Conditional Execution

```yaml
# Only run on changed files
- uses: dorny/paths-filter@v3
  id: filter
  with:
    filters: |
      rust:
        - 'generated/rust/**'
      typescript:
        - 'generated/typescript/**'

- name: Build Rust
  if: steps.filter.outputs.rust == 'true'
  run: cargo build
```

---

## Security Best Practices

### Secret Management

```yaml
# Use GitHub Secrets for sensitive data
env:
  CARGO_TOKEN: ${{ secrets.CARGO_TOKEN }}
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  PYPI_TOKEN: ${{ secrets.PYPI_TOKEN }}

# Use GitHub Environments for protected branches
jobs:
  publish:
    environment: production
    steps:
      - name: Publish
        env:
          TOKEN: ${{ secrets.REGISTRY_TOKEN }}
```

### Dependency Pinning

```yaml
# Pin action versions to commit SHA
- uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608  # v4.1.0
- uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8  # v4.0.0
```

### Permission Restrictions

```yaml
permissions:
  contents: read
  packages: write
  pull-requests: write
  issues: write
```

---

## Monitoring and Alerting

### Workflow Status Monitoring

```yaml
- name: Report workflow status
  if: always()
  uses: actions/github-script@v7
  with:
    script: |
      const status = '${{ job.status }}';
      if (status === 'failure') {
        // Send Slack notification
        // Create GitHub issue
        // Alert on-call engineer
      }
```

### Performance Metrics

```yaml
- name: Record workflow metrics
  run: |
    echo "workflow_duration_seconds $(($SECONDS - $START_TIME))" >> metrics.txt
    echo "test_count $(cargo test -- --list | wc -l)" >> metrics.txt
```

---

## Troubleshooting

### Common Issues

**Issue**: Cache miss causing slow builds
**Solution**: Review cache key strategy, ensure lock files committed

**Issue**: Flaky tests failing intermittently
**Solution**: Add retry logic, increase timeouts, improve test isolation

**Issue**: Rate limiting on registry
**Solution**: Implement exponential backoff, use registry mirrors

**Issue**: Workflow timeout
**Solution**: Optimize build steps, increase timeout, parallelize jobs

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Reusable Workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
