# Contributing Guide

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope

Optional scope to indicate the area of the change:

- `server` - Backend server code
- `frontend` - Frontend React code
- `optimizer` - Image optimization logic
- `metadata` - Metadata management
- `security` - Security features
- `cache` - Caching system
- `config` - Configuration
- `deps` - Dependencies
- `docs` - Documentation
- `tests` - Tests
- `ci` - CI/CD

### Subject

- Use imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize first letter
- No period (.) at the end
- Max 72 characters

### Body (optional)

- Explain *what* and *why* vs. *how*
- Wrap at 72 characters
- Can include multiple paragraphs

### Footer (optional)

- Reference issues: `Fixes #123` or `Closes #456`
- Breaking changes: `BREAKING CHANGE: <description>`

### Examples

```
feat(server): add rate limiting to optimize endpoint

Add rate limiting middleware to prevent DoS attacks on the /optimize endpoint.
Limits to 100 requests per minute per IP address.

Closes #123
```

```
fix(frontend): resolve preview image 404 errors

Fixed path resolution issue in preview endpoint that was causing 404 errors
for images in nested date-based folders.

Fixes #456
```

```
docs(readme): update deployment instructions

Add production environment variables and deployment steps.
```

```
chore(deps): update sharp to v0.33.0

Update sharp dependency to latest version for better performance.
```

## Using Commitizen

For interactive commit messages:

```bash
bun run commit
```

This will guide you through creating a properly formatted commit message.

## Release Process

### Automatic Releases

Releases are automatically created when you push to `main` branch with conventional commits.

### Manual Release

```bash
# Patch release (1.0.0 -> 1.0.1)
bun run release:patch

# Minor release (1.0.0 -> 1.1.0)
bun run release:minor

# Major release (1.0.0 -> 2.0.0)
bun run release:major

# Dry run (see what would happen)
bun run release:dry-run
```

### Version Bumping Rules

- **PATCH** (1.0.0 -> 1.0.1): Bug fixes
- **MINOR** (1.0.0 -> 1.1.0): New features (backward compatible)
- **MAJOR** (1.0.0 -> 2.0.0): Breaking changes

## Development Workflow

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Write/update tests
4. Commit using conventional commits: `bun run commit`
5. Push and create pull request
6. After merge to main, CI/CD will handle release

