#!/bin/bash

# Workflow Validation Script
# Validates all GitHub Actions workflow files

set -e

WORKFLOWS_DIR=".github/workflows"
ERRORS=0
WARNINGS=0

echo "🔍 Validating GitHub Actions Workflows"
echo "======================================"
echo ""

# Check if workflows directory exists
if [ ! -d "$WORKFLOWS_DIR" ]; then
    echo "❌ Error: Workflows directory not found: $WORKFLOWS_DIR"
    exit 1
fi

# Count workflow files
WORKFLOW_COUNT=$(find "$WORKFLOWS_DIR" -name "*.yml" -type f | wc -l)
echo "📁 Found $WORKFLOW_COUNT workflow files"
echo ""

# Function to validate YAML syntax
validate_yaml() {
    local file=$1
    local filename=$(basename "$file")

    echo "Validating: $filename"

    # Check if file is empty
    if [ ! -s "$file" ]; then
        echo "  ❌ Error: File is empty"
        ERRORS=$((ERRORS + 1))
        return 1
    fi

    # Check for basic YAML syntax using Python
    if command -v python3 &> /dev/null; then
        python3 -c "
import yaml
import sys
try:
    with open('$file', 'r') as f:
        yaml.safe_load(f)
    print('  ✅ Valid YAML syntax')
except yaml.YAMLError as e:
    print(f'  ❌ YAML Error: {e}')
    sys.exit(1)
" || { ERRORS=$((ERRORS + 1)); return 1; }
    else
        echo "  ⚠️  Warning: Python3 not found, skipping YAML validation"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for required fields
    if grep -q "^name:" "$file"; then
        echo "  ✅ Has 'name' field"
    else
        echo "  ❌ Missing 'name' field"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "^on:" "$file"; then
        echo "  ✅ Has 'on' trigger field"
    else
        echo "  ❌ Missing 'on' trigger field"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "^jobs:" "$file"; then
        echo "  ✅ Has 'jobs' field"
    else
        echo "  ❌ Missing 'jobs' field"
        ERRORS=$((ERRORS + 1))
    fi

    # Check for common issues
    if grep -q "secrets\\.GITHUB_TOKEN" "$file"; then
        echo "  ⚠️  Warning: Using secrets.GITHUB_TOKEN (prefer github.token)"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for shell script safety
    if grep -q "run: |" "$file"; then
        if grep -q "set -e" "$file"; then
            echo "  ✅ Shell scripts use 'set -e'"
        else
            echo "  ⚠️  Warning: Shell scripts should use 'set -e' for error handling"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi

    echo ""
}

# Validate each workflow file
for workflow in "$WORKFLOWS_DIR"/*.yml; do
    if [ -f "$workflow" ]; then
        validate_yaml "$workflow"
    fi
done

# Check for dependabot configuration
if [ -f ".github/dependabot.yml" ]; then
    echo "✅ Dependabot configuration found"
    # Dependabot has different structure, just check YAML syntax
    if command -v python3 &> /dev/null; then
        python3 -c "
import yaml
import sys
try:
    with open('.github/dependabot.yml', 'r') as f:
        yaml.safe_load(f)
    print('  ✅ Valid YAML syntax')
except yaml.YAMLError as e:
    print(f'  ❌ YAML Error: {e}')
    sys.exit(1)
" || ERRORS=$((ERRORS + 1))
    fi
    echo ""
else
    echo "⚠️  Warning: No dependabot.yml found"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "======================================"
echo "📊 Validation Summary"
echo "======================================"
echo "Total workflows: $WORKFLOW_COUNT"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ All workflows are valid!"
    exit 0
else
    echo "❌ Validation failed with $ERRORS error(s)"
    exit 1
fi
