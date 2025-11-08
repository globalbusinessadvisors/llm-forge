# LLM-Forge DevOps Documentation

## Overview

Complete DevOps pipeline documentation for LLM-Forge multi-language SDK generation, build, test, and publishing system.

---

## Quick Navigation

### Start Here

📋 **[Executive Summary](devops-executive-summary.md)** - High-level overview for stakeholders

### Core Documentation

1. 🏗️ **[Pipeline Architecture](devops-pipeline-architecture.md)**
   - Complete pipeline design
   - Multi-language build system integration
   - Quality gates and automation
   - Version management strategy

2. 🔨 **[Build System Specifications](build-system-specs.md)**
   - Build tool configurations for all 6 languages
   - Optimization strategies
   - Performance benchmarks
   - Build scripts and commands

3. ✅ **[Quality Gates](quality-gates.md)**
   - 8 sequential quality gates
   - Per-language quality checks
   - Coverage thresholds
   - Security scanning procedures

4. 📦 **[Versioning Strategy](versioning-strategy.md)**
   - Semantic versioning implementation
   - Cross-language version synchronization
   - Breaking change detection
   - Deprecation policies

5. 🚀 **[CI/CD Workflows](ci-cd-workflows.md)**
   - GitHub Actions workflow specifications
   - Reusable workflow templates
   - Automated testing matrix
   - Release automation

6. 📤 **[Publishing Guide](publishing-guide.md)**
   - Registry-specific publishing procedures
   - Authentication and credentials
   - Post-publishing verification
   - Rollback procedures

---

## Language-Specific Build Systems

### Rust (Cargo → crates.io)
- **Build Tool**: Cargo
- **Build Time**: ~5 minutes
- **Package Format**: `.crate`
- **Registry**: https://crates.io/
- **Documentation**: Auto-hosted on docs.rs

### TypeScript/JavaScript (npm → npmjs.com)
- **Build Tool**: npm/tsc
- **Build Time**: ~3 minutes
- **Package Format**: `.tgz` (tarball)
- **Registry**: https://www.npmjs.com/
- **Documentation**: README on npm page

### Python (Poetry → PyPI)
- **Build Tool**: Poetry
- **Build Time**: ~2 minutes
- **Package Format**: `.whl` + `.tar.gz`
- **Registry**: https://pypi.org/
- **Documentation**: README on PyPI page

### C# (dotnet → nuget.org)
- **Build Tool**: dotnet CLI
- **Build Time**: ~4 minutes
- **Package Format**: `.nupkg`
- **Registry**: https://www.nuget.org/
- **Documentation**: README on NuGet page

### Go (go → pkg.go.dev)
- **Build Tool**: go CLI
- **Build Time**: ~2 minutes
- **Package Format**: Source (git tags)
- **Registry**: https://pkg.go.dev/
- **Documentation**: Auto-generated from comments

### Java (Maven → Maven Central)
- **Build Tool**: Maven
- **Build Time**: ~5 minutes
- **Package Format**: `.jar` (+ sources + javadoc)
- **Registry**: https://central.sonatype.com/
- **Documentation**: Javadoc JAR

---

## Pipeline Stages

### 1. Code Generation
**Duration**: ~5 minutes
- Parse OpenAPI/AsyncAPI specifications
- Generate SDK code for all 6 languages
- Apply templates and customizations
- Validate generated code syntax

### 2. Parallel Build
**Duration**: ~5 minutes
- Build all 6 language SDKs in parallel
- Dependency resolution and caching
- Compilation/transpilation
- Generate build artifacts

### 3. Quality Gates (Sequential)
**Duration**: ~15-20 minutes

1. ✅ Code Compilation (0 errors, 0 warnings)
2. ✅ Type Checking (static analysis)
3. ✅ Unit Tests (80%+ coverage)
4. ✅ Integration Tests (API contracts)
5. ✅ Code Quality (linting, formatting)
6. ✅ Security Scanning (no critical vulnerabilities)
7. ✅ License Compliance (approved licenses only)
8. ✅ Breaking Changes (semantic versioning)

### 4. Artifact Packaging
**Duration**: ~5 minutes
- Generate documentation
- Build distribution packages
- Sign packages (where applicable)
- Create release notes

### 5. Publishing
**Duration**: ~10 minutes
- Dry-run validation
- Parallel publish to all 6 registries
- Verify publications
- Create GitHub release
- Update documentation sites

**Total Release Time**: ~45-60 minutes

---

## Quick Commands

### Build All SDKs
```bash
./scripts/build-all.sh
```

### Run All Tests
```bash
./scripts/test-all.sh
```

### Check All Quality Gates
```bash
./scripts/quality-gates.sh
```

### Bump Version
```bash
# Major version bump (breaking changes)
./scripts/version.sh major     # 1.5.2 → 2.0.0

# Minor version bump (new features)
./scripts/version.sh minor     # 1.5.2 → 1.6.0

# Patch version bump (bug fixes)
./scripts/version.sh patch     # 1.5.2 → 1.5.3
```

### Publish All SDKs
```bash
# Dry run (test without publishing)
./scripts/publish-all.sh --dry-run

# Actual publish
./scripts/publish-all.sh
```

### Verify Published Version
```bash
./scripts/verify-published.sh 1.5.2
```

---

## CI/CD Workflows

### GitHub Actions Workflows

Located in `.github/workflows/`:

1. **generate.yml** - Code generation from API specs
2. **pr-validation.yml** - Validate pull requests
3. **main-build.yml** - Build on push to main
4. **release.yml** - Full release pipeline
5. **scheduled.yml** - Daily/weekly/monthly tasks

### Workflow Triggers

**Pull Request**:
```bash
git checkout -b feature/my-change
git push origin feature/my-change
# Creates PR → Triggers pr-validation.yml
```

**Release**:
```bash
./scripts/version.sh minor
git push origin main
git push origin v1.6.0
# Tag push → Triggers release.yml
```

**Manual**:
```bash
# Via GitHub UI: Actions → Select workflow → Run workflow
```

---

## Environment Setup

### Required GitHub Secrets

Configure in repository settings → Secrets:

```
CARGO_TOKEN         # crates.io API token
NPM_TOKEN           # npmjs.com API token
PYPI_TOKEN          # PyPI API token
NUGET_TOKEN         # nuget.org API key
GPG_PRIVATE_KEY     # For signing Java artifacts
GPG_PASSPHRASE      # GPG key passphrase
SONATYPE_USERNAME   # Maven Central username
SONATYPE_PASSWORD   # Maven Central password
```

### Local Development Setup

**Prerequisites**:
- Rust 1.70+
- Node.js 18+
- Python 3.8+
- .NET 6.0+
- Go 1.21+
- Java 17+

**Install Build Tools**:
```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js/npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python/Poetry
curl -sSL https://install.python-poetry.org | python3 -

# .NET
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0

# Go
wget https://go.dev/dl/go1.21.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.linux-amd64.tar.gz

# Java (OpenJDK)
sudo apt-get install -y openjdk-17-jdk maven
```

---

## Monitoring and Metrics

### Build Metrics
- Build duration per language
- Test execution time
- Code coverage trends
- Quality gate pass rate

### Quality Metrics
- Test success rate (target: 100%)
- Code coverage (target: ≥80%)
- Security vulnerabilities (target: 0 critical)
- License compliance (target: 100%)

### Publishing Metrics
- Publish success rate (target: ≥98%)
- Registry download counts
- Version adoption rates
- Time from tag to publish

### Dashboards
- GitHub Actions insights
- Codecov integration
- Security scanning results
- Registry statistics

---

## Troubleshooting

### Common Issues

**Build Failures**:
1. Check CI/CD logs in GitHub Actions
2. Run build locally: `./scripts/build-all.sh`
3. Verify dependencies installed
4. Check for version conflicts

**Test Failures**:
1. Run tests locally: `./scripts/test-all.sh`
2. Check test logs for specific failures
3. Verify test environment setup
4. Isolate failing test and debug

**Quality Gate Failures**:
1. Review quality gate report
2. Run specific gate locally
3. Fix violations
4. Re-run quality checks

**Publishing Failures**:
1. Verify registry credentials
2. Check registry status
3. Validate package metadata
4. Retry or rollback

**Version Conflicts**:
1. Verify VERSION file
2. Check all package files synchronized
3. Run version verification script
4. Fix inconsistencies

---

## Best Practices

### Development
- ✅ Test locally before pushing
- ✅ Run quality gates before PR
- ✅ Keep commits atomic and focused
- ✅ Write descriptive commit messages

### Releases
- ✅ Update CHANGELOG.md
- ✅ Document breaking changes
- ✅ Test in staging first
- ✅ Monitor post-release

### Security
- ✅ Rotate secrets regularly
- ✅ Review dependency updates
- ✅ Respond to security alerts quickly
- ✅ Audit access permissions

### Documentation
- ✅ Keep docs up-to-date
- ✅ Document all changes
- ✅ Provide migration guides
- ✅ Include code examples

---

## Support

### Getting Help

**Documentation Issues**:
- Create issue: [GitHub Issues](https://github.com/llm-forge/llm-forge/issues)

**Build/CI/CD Issues**:
- Check workflow logs
- Review documentation
- Ask in discussions

**Emergency Support**:
- On-call: (contact information)
- Slack: #llm-forge-devops
- Email: devops@llm-forge.dev

---

## Additional Resources

### External Documentation
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
- [npm Documentation](https://docs.npmjs.com/)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [dotnet CLI Reference](https://learn.microsoft.com/en-us/dotnet/core/tools/)
- [Go Modules](https://go.dev/ref/mod)
- [Maven Documentation](https://maven.apache.org/guides/)

### Related Documents
- [Architecture Overview](architecture-overview.md)
- [Language Strategy](language-strategy.md)
- [Code Style Guidelines](code-style-guidelines.md)
- [Template Examples](template-examples.md)

---

## Document Maintenance

**Last Updated**: 2024-11-07
**Maintained By**: DevOps Team
**Review Frequency**: Quarterly
**Next Review**: 2025-02-07

**Change Log**:
- 2024-11-07: Initial documentation complete
- TBD: Updates based on implementation feedback

---

## Feedback

Found an issue or have a suggestion? Please:
1. Open a GitHub issue
2. Submit a pull request
3. Contact the DevOps team

Your feedback helps improve our documentation and processes!
