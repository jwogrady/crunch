# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.1.2-alpha.1] - 2025-10-31

### ✨ Features

- **Bulk delete functionality** - Select multiple images with checkboxes and delete them at once
- **Single image delete** - Delete button in metadata editor
- **Improved keywords input** - Allows typing commas freely, parses on blur
- **WordPress export with absolute URLs** - Configurable BASE_URL for production server imports
- **Enhanced WordPress CSV format** - Compatible with WP All Import and Ultimate CSV Importer plugins

### 🐛 Bug Fixes

- Fixed metadata persistence issue - normalized paths in `getMetadataPath()` for consistent hashing
- Fixed metadata saving on first click - resolved closure issue in `loadImages()`
- Fixed preview endpoint - added middleware to handle URL-encoded paths (`%2F`)
- Fixed metadata PUT endpoint - added middleware handling for URL-encoded paths
- Fixed rename endpoint - added middleware handling for URL-encoded paths
- Fixed bulk delete - added recursive filename search fallback
- Fixed `getMetadataPath` import error - exported function from metadata module
- Fixed keywords handling - supports both arrays and comma-separated strings
- Fixed image loading/disappearing - added retry logic with placeholders
- Improved checkbox visibility - added white background and shadow for better UX

### 🔧 Technical Improvements

- Added `onRequest` middleware to handle URL-encoded paths before Elysia routing
- Consolidated wildcard route handling (preview, metadata GET/PUT, rename POST) in middleware
- Improved path normalization in `getMetadataPath()` - handles absolute and relative paths consistently
- Added BASE_URL configuration for WordPress export absolute URLs
- Enhanced CSV export with proper escaping (handles commas, quotes, newlines)
- Added UTF-8 BOM for Excel compatibility in CSV exports
- Improved error handling and validation throughout

### 📝 Documentation

- Updated README with BASE_URL configuration
- Added WordPress export format documentation

## [0.1.1-alpha.1] - 2025-10-31

### 🧹 Cleanup

- Consolidated deployment documentation (removed redundant Railway configs)
- Removed test artifacts and build outputs
- Updated project structure for alpha release
- Streamlined documentation references
- Improved `.gitignore` organization

## [0.1.0-alpha.1] - 2025-10-31

### 🔨 Chores

* setup semantic versioning and conventional commits

### ✨ Features

- Initial alpha release
- Image optimization with Sharp
- Multiple format support (WebP, JPEG, Both)
- Batch image processing
- Date-based folder organization (YYYY/MM/DD)
- Image gallery with previews
- Metadata management (title, alt text, description, caption, keywords)
- SEO-friendly filename generation
- WordPress export (CSV format)
- Thumbnail generation with caching
- ZIP download for all optimized images

### 🐛 Bug Fixes

- Fixed import path issues in server.ts
- Fixed JSX syntax errors in App.tsx
- Fixed preview endpoint 404 errors
- Fixed Tailwind CSS CDN warning

### 📝 Documentation

- Complete README with setup instructions
- Quick start guide
- Test coverage documentation
- Integration test documentation

### ✅ Tests

- Comprehensive test suite (127 tests)
- 97%+ code coverage
- Integration tests
- Build verification tests

### 🔒 Security

- Path traversal prevention
- Input sanitization
- File type validation
- File size limits
- Error message sanitization

### 🔧 Configuration

- Environment-based configuration
- Logging system with levels
- Production-ready error handling
