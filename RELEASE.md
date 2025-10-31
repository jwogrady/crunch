# Release Guide

## Versioning

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 -> 2.0.0): Breaking changes
- **MINOR** (1.0.0 -> 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 -> 1.0.1): Bug fixes

## Release Workflow

### Automatic Releases (Recommended)

1. Make commits following [Conventional Commits](https://www.conventionalcommits.org/)
2. Push to `main` branch
3. CI/CD automatically:
   - Analyzes commits
   - Bumps version
   - Generates changelog
   - Creates git tag
   - Creates GitHub release

### Manual Release

```bash
# 1. Ensure all changes are committed
git status

# 2. Run release (automatically determines version bump)
bun run release

# Or specify version bump:
bun run release:patch    # 1.0.0 -> 1.0.1
bun run release:minor    # 1.0.0 -> 1.1.0
bun run release:major    # 1.0.0 -> 2.0.0

# 3. Review generated files:
# - package.json (version updated)
# - CHANGELOG.md (updated with new release)

# 4. Push tags
git push --follow-tags origin main
```

## Release Checklist

Before releasing:

- [ ] All tests passing (`bun test`)
- [ ] No linting errors
- [ ] Documentation updated
- [ ] CHANGELOG.md reviewed
- [ ] Version in package.json correct
- [ ] Build succeeds (`bun run build`)
- [ ] All commits follow conventional format

## What Gets Released

1. **Version Bump**: Updated in `package.json`
2. **Changelog**: Auto-generated from commits in `CHANGELOG.md`
3. **Git Tag**: Created with version number (e.g., `v1.0.0`)
4. **GitHub Release**: Created with changelog as release notes

## Commit Types and Version Bumps

- `feat:` → **MINOR** version bump
- `fix:` → **PATCH** version bump
- `perf:` → **PATCH** version bump
- `refactor:` → **PATCH** version bump
- `docs:` → No version bump (unless specified)
- `test:` → No version bump (unless specified)
- `chore:` → No version bump (unless specified)
- `BREAKING CHANGE:` → **MAJOR** version bump

## Example Release

```bash
# Current version: 1.0.0

# Make some commits:
git commit -m "feat(server): add rate limiting"
git commit -m "fix(frontend): resolve preview 404 errors"
git commit -m "docs: update README"

# Run release
bun run release

# Result:
# - Version: 1.1.0 (minor bump due to feat)
# - CHANGELOG.md updated
# - Git tag v1.1.0 created
# - Ready to push
```

## Troubleshooting

### Release fails with "working directory not clean"

```bash
# Commit or stash changes
git add .
git commit -m "chore: prepare for release"
```

### Wrong version bump detected

```bash
# Use specific version bump
bun run release:patch   # Force patch
bun run release:minor   # Force minor
bun run release:major   # Force major
```

### Need to test release without pushing

```bash
# Dry run
bun run release:dry-run

# This shows what would happen without making changes
```

## CI/CD Integration

The `.github/workflows/release.yml` workflow:
- Runs on push to `main`
- Skips if commit message contains `chore(release)`
- Runs tests
- Builds project
- Generates changelog
- Bumps version
- Creates GitHub release
- Pushes tags

