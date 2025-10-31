# Integration Tests Explained

## Why Integration Tests Matter

Your **unit tests passed** but the **app failed to run**. Here's why:

### Unit Tests vs Integration Tests

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| **What they test** | Individual functions | Module interactions |
| **Import paths** | From test file location | From actual file locations |
| **Syntax checking** | Function logic only | Full TypeScript/JSX compilation |
| **Build verification** | ❌ No | ✅ Yes |
| **Runtime verification** | ❌ No | ✅ Yes |

### The Problem You Encountered

**Unit Test** (from `tests/utils/helpers.test.ts`):
```typescript
import { formatBytes } from "../../src/utils/helpers"; // ✅ Works!
// Path: tests/ → ../../ → src/utils/helpers
```

**Actual App** (from `src/server.ts`):
```typescript
import { CONSTANTS } from "../utils/constants"; // ❌ BROKEN!
// Path: src/server.ts → ../ → utils/constants (doesn't exist!)
// Should be: ./utils/constants
```

**Why Unit Tests Missed It:**
- Tests import from `tests/` directory
- App imports from `src/` directory  
- Different locations = different relative paths
- Unit tests never verified if `server.ts` could resolve its own imports

## Integration Tests Added

### 1. **Build Tests** (`tests/integration/build.test.ts`)

These tests:
- ✅ Verify all source files exist
- ✅ Check modules can be imported from actual locations
- ✅ Verify TypeScript/JSX files compile
- ✅ Test import resolution from file's own location
- ✅ Catch syntax errors before runtime

### 2. **Runtime Tests** (`tests/integration/runtime.test.ts`)

These tests:
- ✅ Verify server can actually start
- ✅ Check for immediate startup errors
- ✅ Validate app can run (not just compile)

## How to Use

```bash
# Run all tests (unit + integration)
bun test

# Run just integration tests
bun test tests/integration/

# Run with coverage
bun test --coverage
```

## What Gets Caught Now

### ✅ Import Path Errors
- Wrong relative paths (`../` vs `./`)
- Missing modules
- Circular dependencies

### ✅ Syntax Errors
- JSX syntax issues
- TypeScript errors
- Missing exports

### ✅ Build Errors
- Compilation failures
- Missing dependencies
- Type mismatches

### ✅ Runtime Errors
- Server startup failures
- Module resolution errors
- Immediate crashes

## Best Practices

1. **Always run integration tests** before committing
2. **Run both unit AND integration** in CI/CD
3. **Fix import paths immediately** when integration tests fail
4. **Don't skip build verification** - it catches real issues

## Example Workflow

```bash
# 1. Make changes
# 2. Run tests
bun test

# 3. If integration tests fail, check:
#    - Import paths
#    - File structure
#    - Syntax errors

# 4. Fix and repeat
```

## Summary

**Before:** Unit tests passed ✅, but app failed ❌
**After:** Integration tests catch import/build errors ✅

**Unit tests** verify your code is correct.
**Integration tests** verify your code works together.

