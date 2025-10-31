# Setup Guide - Semantic Versioning & Conventional Commits

## Quick Setup

```bash
# 1. Install dependencies (including new ones)
bun install

# 2. Install Husky (Git hooks)
bunx husky install || npx husky install

# 3. Make hooks executable
chmod +x .husky/pre-commit .husky/commit-msg

# 4. Initialize git repository (if not already done)
git init
git add .
git commit -m "chore: initial commit"
```

## What's Included

### ✅ Conventional Commits
- Commit message validation
- Interactive commit helper (`bun run commit`)
- Pre-commit hooks

### ✅ Semantic Versioning
- Automatic version bumping
- CHANGELOG generation
- Git tag creation

### ✅ CI/CD
- Automated testing on push
- Automated releases
- Build verification

## Usage

### Making Commits

**Option 1: Interactive (Recommended)**
```bash
bun run commit
```
This will guide you through creating a properly formatted commit.

**Option 2: Manual**
```bash
git commit -m "feat(server): add rate limiting"
```

### Creating Releases

**Automatic (Recommended)**
Just push to `main` with conventional commits. CI/CD handles the rest.

**Manual**
```bash
# Patch (1.0.0 -> 1.0.1)
bun run release:patch

# Minor (1.0.0 -> 1.1.0)
bun run release:minor

# Major (1.0.0 -> 2.0.0)
bun run release:major

# Auto-detect from commits
bun run release
```

## Files Created

### Configuration
- `.commitlintrc.json` - Commit message rules
- `.versionrc.json` - Version bumping rules
- `package.json` - Updated with release scripts

### Git Hooks
- `.husky/pre-commit` - Validates commit message
- `.husky/commit-msg` - Validates commit format

### CI/CD
- `.github/workflows/ci.yml` - Continuous integration
- `.github/workflows/release.yml` - Automated releases

### Documentation
- `CHANGELOG.md` - Auto-generated changelog
- `CONTRIBUTING.md` - Contribution guidelines
- `RELEASE.md` - Release process guide
- `SETUP.md` - This file

## Commit Message Examples

```
feat(server): add rate limiting middleware
fix(frontend): resolve preview 404 errors
docs(readme): update deployment instructions
perf(cache): improve thumbnail generation
refactor(metadata): simplify SEO filename logic
test(server): add integration tests
chore(deps): update sharp to v0.33.0
```

## Release Flow

1. **Make changes** with conventional commits
2. **Push to main** branch
3. **CI/CD automatically**:
   - Runs tests
   - Builds project
   - Analyzes commits
   - Bumps version
   - Generates changelog
   - Creates git tag
   - Creates GitHub release

## Troubleshooting

### Commit message rejected

Your commit doesn't follow the conventional format. Use:
```bash
bun run commit
```

### Release fails

Ensure you have:
- All changes committed
- Conventional commit messages
- Tests passing
- Build successful

### Husky not working

```bash
# Reinstall hooks
bunx husky install
chmod +x .husky/*
```

---

**Ready to use!** Start making commits with `bun run commit` 🚀

