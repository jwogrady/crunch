# Test Suite

## Test Coverage

This project has comprehensive test coverage for all core functionality:

### Test Files

1. **`tests/utils/helpers.test.ts`** - Utility function tests
   - formatBytes
   - validatePath
   - sanitizePath
   - getFileExtension
   - isImageFile
   - debounce
   - sleep

2. **`tests/utils/helpers.edge.test.ts`** - Edge case tests
   - Boundary conditions
   - Error handling
   - Extreme values

3. **`tests/utils/constants.test.ts`** - Constants validation
   - CONSTANTS object
   - SUPPORTED_FORMATS
   - validateFileType
   - validateFileSize

4. **`tests/server/utils/security.test.ts`** - Security tests
   - Path validation
   - Directory traversal prevention
   - File type validation

5. **`tests/server/utils/cache.test.ts`** - Caching tests
   - Thumbnail caching
   - Metadata caching
   - Cache invalidation

6. **`tests/optimizer.test.ts`** - Image optimization tests
   - Format conversion (WebP, JPEG, both)
   - Resizing
   - Quality settings
   - File size calculations
   - Date-based folder structure

7. **`tests/metadata.test.ts`** - Metadata management tests
   - Metadata extraction
   - Save/load metadata
   - SEO filename generation
   - File renaming
   - Image scanning

8. **`tests/metadata.integration.test.ts`** - Integration tests
   - Full metadata workflow
   - End-to-end scenarios

9. **`tests/metadata.error.test.ts`** - Error handling tests
   - Non-existent files
   - Missing paths
   - Error recovery

10. **`tests/api/server.test.ts`** - API endpoint tests
    - Security validation
    - File validation

## Running Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test tests/utils/helpers.test.ts
```

## Coverage Goals

- **Functions**: 100%
- **Lines**: 95%+
- **Branches**: 90%+

## Test Structure

All tests follow the pattern:
```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test";

describe("Feature Name", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  test("should do something", () => {
    expect(result).toBe(expected);
  });
});
```

## Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts`
3. Import functions from `src/`
4. Use beforeEach/afterEach for setup/cleanup
5. Test both success and error cases
6. Test edge cases and boundary conditions

