# CI/CD Pipeline Documentation

## Overview

LLM-Forge uses a comprehensive, enterprise-grade CI/CD pipeline built with GitHub Actions. The pipeline ensures code quality, security, and reliable releases through automated testing, validation, and deployment.

## Pipeline Architecture

### 🔄 Workflow Overview

```
┌─────────────────┐
│   Pull Request  │
└────────┬────────┘
         │
         ├──► PR Validation
         │    ├─ Type Check
         │    ├─ Linting
         │    ├─ Format Check
         │    ├─ Tests (Multi-Node)
         │    ├─ Coverage
         │    ├─ Build
         │    └─ Quality Gate
         │
         ├──► Security Scan
         │    ├─ Dependency Scan
         │    ├─ CodeQL
         │    ├─ Secret Scan
         │    ├─ License Check
         │    └─ SAST
         │
         └──► Performance Check
              ├─ Benchmarks
              └─ Regression Detection

┌─────────────────┐
│   Main Branch   │
└────────┬────────┘
         │
         ├──► CI Pipeline
         │    ├─ Quality Checks
         │    ├─ Multi-OS Testing
         │    ├─ Build & Verify
         │    ├─ Coverage Report
         │    └─ Deploy Docs
         │
         └──► Security Scan
              └─ (Full scan suite)

┌─────────────────┐
│   Release Tag   │
└────────┬────────┘
         │
         └──► Release Pipeline
              ├─ Validation
              ├─ Full Test Suite
              ├─ Build Package
              ├─ Publish to npm
              ├─ Publish to GitHub Packages
              ├─ Create GitHub Release
              └─ Post-Release Notifications
```

## Workflows

### 1. Pull Request Validation (`pr-validation.yml`)

**Trigger:** Pull requests to `main` or `develop` branches

**Purpose:** Ensure code quality before merging

**Jobs:**
- **check-skip**: Skip validation for draft PRs
- **install**: Install and cache dependencies
- **type-check**: TypeScript type validation
- **lint**: ESLint code quality check
- **format**: Prettier format verification
- **test**: Run tests on Node 20 & 21
- **coverage**: Generate and verify coverage (92%+ target)
- **build**: Build package and verify output
- **quality-gate**: Final approval gate

**Key Features:**
- ✅ Parallel job execution for speed
- ✅ Node version matrix testing (20, 21)
- ✅ Dependency caching
- ✅ Automated PR comments with results
- ✅ Skip draft PRs
- ✅ Concurrency control (cancel in-progress runs)

**Required Secrets:**
- `CODECOV_TOKEN` (optional, for coverage reporting)

### 2. Continuous Integration (`ci.yml`)

**Trigger:** Push to `main` or `develop` branches

**Purpose:** Comprehensive testing and build verification

**Jobs:**
- **quality**: Run full quality checks
- **test-matrix**: Test on multiple OS (Ubuntu, macOS, Windows) and Node versions
- **benchmark**: Run performance benchmarks
- **build**: Build package
- **test-install**: Verify package installation
- **coverage-report**: Upload coverage to Codecov
- **docs**: Deploy documentation to GitHub Pages
- **status**: Create commit status summary

**Key Features:**
- ✅ Multi-OS testing (Linux, macOS, Windows)
- ✅ Performance tracking
- ✅ Automated documentation deployment
- ✅ Build artifact retention (30 days)
- ✅ Coverage badge generation

**Required Secrets:**
- `CODECOV_TOKEN` (for coverage reporting)

### 3. Release and Publish (`release.yml`)

**Trigger:**
- Tags matching `v*.*.*`
- Manual workflow dispatch

**Purpose:** Automated version release and package publishing

**Jobs:**
- **validate**: Version validation and prerelease detection
- **test**: Full test suite before release
- **build**: Build release package
- **publish-npm**: Publish to npm registry
- **publish-github**: Publish to GitHub Packages
- **create-release**: Create GitHub release with changelog
- **notify**: Post-release notifications
- **update-version**: Update version in main branch

**Key Features:**
- ✅ Semantic versioning validation
- ✅ Automated changelog generation
- ✅ Dual publishing (npm + GitHub Packages)
- ✅ Prerelease support (alpha, beta, rc)
- ✅ npm provenance attestation
- ✅ Release artifact retention (90 days)

**Required Secrets:**
- `NPM_TOKEN` (for npm publishing)
- `GITHUB_TOKEN` (automatically provided)

**Release Process:**
```bash
# Create a release tag
git tag v1.2.3
git push origin v1.2.3

# Or use workflow dispatch
# Go to Actions > Release and Publish > Run workflow
```

### 4. Security Scanning (`security.yml`)

**Trigger:**
- Push to `main` or `develop`
- Pull requests
- Daily at 2 AM UTC
- Manual dispatch

**Purpose:** Comprehensive security analysis

**Jobs:**
- **dependency-scan**: npm audit for vulnerabilities
- **codeql**: GitHub CodeQL security analysis
- **secret-scan**: TruffleHog secret detection
- **license-check**: License compliance verification
- **sast**: Static application security testing
- **dependency-review**: PR dependency analysis
- **scorecard**: OSSF security scorecard
- **container-scan**: Docker image scanning (if applicable)
- **security-summary**: Aggregate security results

**Key Features:**
- ✅ Multiple security scanning tools
- ✅ Daily automated scans
- ✅ License compliance checking
- ✅ Secret detection in commits
- ✅ Automated PR comments with results

**Allowed Licenses:**
- MIT, Apache-2.0, ISC
- BSD-2-Clause, BSD-3-Clause, 0BSD
- CC0-1.0, CC-BY-3.0, CC-BY-4.0
- Unlicense

### 5. Dependency Updates (`dependabot.yml`)

**Trigger:** Weekly on Mondays at 9 AM UTC

**Purpose:** Automated dependency updates

**Configuration:**
- **npm**: Weekly package updates
- **github-actions**: Weekly action updates
- **Grouping**: Minor/patch updates grouped together
- **Auto-merge**: Patch and minor updates auto-merged after passing checks

**Key Features:**
- ✅ Automated dependency updates
- ✅ Security vulnerability alerts
- ✅ Grouped updates to reduce PR noise
- ✅ Auto-approval for minor/patch updates

### 6. Performance Monitoring (`performance.yml`)

**Trigger:**
- Push to `main`
- Pull requests
- Weekly on Sundays at 3 AM UTC
- Manual dispatch

**Purpose:** Track and detect performance regressions

**Jobs:**
- **benchmark**: Run performance benchmarks
- **compare-baseline**: Compare with main branch
- **track-performance**: Store historical data
- **regression-check**: Detect regressions

**Key Features:**
- ✅ Automated performance tracking
- ✅ Historical performance data
- ✅ Regression detection
- ✅ PR performance comparison

**Metrics Tracked:**
- Provider detection speed
- Response parsing speed
- Memory usage
- Build time

### 7. Stale Management (`stale.yml`)

**Trigger:** Daily at 1 AM UTC

**Purpose:** Clean up inactive issues and PRs

**Configuration:**
- **Issues**: 60 days stale, 14 days to close
- **PRs**: 30 days stale, 7 days to close
- **Exempt Labels**: `keep-open`, `bug`, `security`, `enhancement`

## Configuration Requirements

### Required Secrets

Add these secrets in GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `NPM_TOKEN` | npm authentication token | Release workflow |
| `CODECOV_TOKEN` | Codecov upload token | Coverage reporting |

### Optional Secrets

| Secret Name | Description | Used For |
|-------------|-------------|----------|
| `SLACK_WEBHOOK` | Slack notifications | Custom notifications |

### Repository Settings

Required branch protection rules for `main` branch:

```yaml
Branch Protection Rules:
  main:
    require_pull_request_reviews: true
    required_approving_review_count: 1
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
    require_status_checks_to_pass: true
    required_status_checks:
      - "Type Check"
      - "Lint Code"
      - "Check Code Format"
      - "Run Tests"
      - "Test Coverage"
      - "Build Package"
      - "Quality Gate"
    enforce_admins: false
    require_linear_history: true
    allow_force_pushes: false
    allow_deletions: false
```

## Workflow Optimization

### Performance Optimizations

1. **Dependency Caching**
   - npm dependencies cached by `package-lock.json` hash
   - Restored across jobs to avoid repeated installs

2. **Parallel Execution**
   - Independent jobs run in parallel
   - Matrix strategies for multi-version testing

3. **Concurrency Control**
   - In-progress runs cancelled on new commits
   - Prevents resource waste

4. **Artifact Retention**
   - Build artifacts: 30 days
   - Test results: 7 days
   - Benchmarks: 90 days
   - Releases: 90 days

### Resource Management

- **Ubuntu runners** for standard jobs (fastest)
- **Multi-OS testing** only for critical validations
- **Scheduled workflows** run during low-traffic periods

## Monitoring and Alerts

### Status Badges

Add to README.md:

```markdown
![CI](https://github.com/llm-dev-ops/llm-forge/workflows/Continuous%20Integration/badge.svg)
![Security](https://github.com/llm-dev-ops/llm-forge/workflows/Security%20Scanning/badge.svg)
![Coverage](https://codecov.io/gh/llm-dev-ops/llm-forge/branch/main/graph/badge.svg)
```

### Notifications

Configure notifications in GitHub:
- `Settings > Notifications > Actions`
- Enable email/Slack notifications for failures

## Troubleshooting

### Common Issues

#### 1. Tests Failing in CI but Passing Locally

**Cause:** Environment differences

**Solution:**
```bash
# Reproduce CI environment locally
npm ci --prefer-offline
npm run quality
```

#### 2. Coverage Below Threshold

**Cause:** New code without tests

**Solution:**
```bash
# Check coverage locally
npm run test:coverage

# View detailed report
open coverage/index.html
```

#### 3. Build Failures

**Cause:** Type errors or missing dependencies

**Solution:**
```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

#### 4. npm Publish Failures

**Cause:** Invalid npm token or version conflict

**Solution:**
1. Verify `NPM_TOKEN` secret is set correctly
2. Check version doesn't already exist on npm
3. Ensure version in `package.json` matches tag

### Debug Mode

Enable debug logging:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## Best Practices

### 1. Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`

### 2. Pull Request Process

1. Create feature branch from `main`
2. Make changes and commit
3. Push branch and create PR
4. Wait for all checks to pass
5. Request review
6. Address review comments
7. Merge when approved

### 3. Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Commit changes
4. Create and push tag:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
5. Monitor release workflow
6. Verify npm publication

### 4. Security Best Practices

- ✅ Never commit secrets or API keys
- ✅ Use secrets management for sensitive data
- ✅ Keep dependencies updated
- ✅ Review Dependabot PRs promptly
- ✅ Address security vulnerabilities quickly

## Maintenance

### Weekly Tasks

- Review Dependabot PRs
- Check security scan results
- Monitor performance trends

### Monthly Tasks

- Review and update workflow configurations
- Clean up stale artifacts
- Update documentation

### Quarterly Tasks

- Review and optimize workflow performance
- Update GitHub Actions versions
- Audit security practices

## Migration Guide

### From Manual CI to GitHub Actions

1. **Backup existing CI configuration**
2. **Copy workflows to `.github/workflows/`**
3. **Configure secrets in repository settings**
4. **Update branch protection rules**
5. **Test workflows on a feature branch**
6. **Deploy to main branch**

### Customization

To customize workflows:

1. Fork the repository
2. Modify workflow files in `.github/workflows/`
3. Test changes on a feature branch
4. Deploy to your main branch

## Support

### Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Workflow Syntax](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions)
- [Security Hardening](https://docs.github.com/actions/security-guides/security-hardening-for-github-actions)

### Getting Help

1. Check workflow run logs in GitHub Actions tab
2. Review this documentation
3. Search GitHub Issues
4. Open a new issue if problem persists

---

**CI/CD Pipeline Status:** ✅ Production Ready
**Last Updated:** November 8, 2025
**Version:** 1.0.0
