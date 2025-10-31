# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
