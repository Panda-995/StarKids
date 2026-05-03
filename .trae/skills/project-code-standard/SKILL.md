---
name: project-code-standard
description: This skill is used to check, enforce, and fix project code standards. Activate when user needs to establish code style standards, check code compliance, auto-fix formatting issues, generate code quality reports, or verify commits in Code Review. Supports Python (PEP8/black/ruff), JavaScript/TypeScript (ESLint/Prettier), and general project standards (naming, comments, file structure).
---

# Project Code Standard

## Goal

Help developers establish, check, and enforce unified code standards to ensure codebase consistency, readability, and maintainability.

## When to Use

- User asks to "check code standards", "lint code", "format code"
- User asks to "establish code standards", "set code style"
- Verify code quality before Code Review
- User asks "does this code comply with standards?"
- Configure code quality toolchain when initializing new projects
- CI/CD integration of code checking process

## Execution Steps

### Step 1: Identify Project Type

Check the project root directory to identify the tech stack:

```bash
ls package.json pyproject.toml setup.py Cargo.toml go.mod 2>/dev/null
```

### Step 2: Run Standards Check

**JavaScript / TypeScript Project**:

```bash
eslint .  # Code standards
prettier --check .  # Format check
```

**General Standards Check** (naming, comments, file structure):
Manual review of naming conventions, file structure, comment quality.

### Step 3: Present Results

```markdown
## Code Standards Check Report

### Overview
- Files checked: N
- Issues found: X (Critical: A, Warning: B, Hint: C)

### Issue List
| File | Line | Type | Description |
|------|------|------|-------------|
| ... | ... | ... | ... |

### Suggested Fixes
...
```

### Step 4: Auto-Fix (Optional)

If user agrees to auto-fix:

```bash
eslint . --fix
prettier --write .
```

### Step 5: Generate Config Files (New Projects)

If the project has no standards config, copy templates:
- JS/TS: `.eslintrc.json` + `.prettierrc` → project root
- General: `.editorconfig` → project root

## Output Format

Present results in Markdown table format, including:
1. **Overview Stats**: File count, issue count, categorized by severity
2. **Issue List**: File path, line number, issue type, description
3. **Fix Suggestions**: Specific fix strategies for high-frequency issues

## Notes

- Prioritize existing lint configs (`.eslintrc`, `prettier.config.js`, etc.) — do not overwrite user configs
- MUST get user confirmation before auto-fixing — do not modify files directly
- Exclude `node_modules/`, `.venv/`, `dist/`, `build/` directories by default
- If lint tools are not installed, only perform syntax-level and general standards checks, and suggest installing tools
