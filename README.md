# Bun Image Optimizer

A full-stack image optimization web app using **Bun** as the backend runtime and **React + Tailwind CSS** for the frontend interface.

## Features

- 📤 Upload one or more images
- ⚙️ Configure optimization settings (width, quality, format)
- 🚀 Process images with Sharp
- 💾 Download optimized results individually or as a ZIP
- 📊 View before/after file sizes and savings percentage
- 🖼️ **Gallery view** with image previews and thumbnails
- 📝 **Metadata editing** - Title, Alt Text, Caption, Description, Keywords
- 🔄 **SEO-friendly renaming** - Generate optimized filenames automatically
- 📸 **Image preview** - View thumbnails and full-size previews
- 🔍 **Technical metadata** - View dimensions, file sizes, EXIF data
- 📥 **WordPress export** - Generate CSV file ready for WordPress import

## Tech Stack

- **Backend**: Bun + Elysia + Sharp
- **Frontend**: React + Tailwind CSS + Vite
- **Image Processing**: Sharp

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

```bash
# Install dependencies
bun install

# Run everything (backend + frontend)
bun run dev:all
```

Then open **http://localhost:5173** in your browser!

## Development

### Scripts

```bash
# Development
bun run dev          # Backend server only
bun run dev:frontend # Frontend only
bun run dev:all      # Both (recommended)

# Testing
bun test             # Run all tests
bun test:coverage    # With coverage report
bun test:watch       # Watch mode

# Building
bun run build        # Build frontend for production
```

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```bash
# Interactive commit helper
bun run commit

# Or commit manually following format:
# <type>(<scope>): <subject>
#
# Example:
# feat(server): add rate limiting
# fix(frontend): resolve preview 404 errors
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for commit guidelines.

### Releases

```bash
# Automatic version bump (analyzes commits)
bun run release

# Manual version bump
bun run release:patch   # 1.0.0 -> 1.0.1
bun run release:minor   # 1.0.0 -> 1.1.0
bun run release:major   # 1.0.0 -> 2.0.0
```

See [RELEASE.md](./RELEASE.md) for release process.

## API Endpoints

- `POST /optimize` - Optimize uploaded images
- `GET /download/:file` - Download a specific optimized image
- `GET /download-all` - Download all optimized images as ZIP
- `GET /api/images` - List all images with metadata
- `GET /api/images/*/metadata` - Get metadata for specific image
- `PUT /api/images/*/metadata` - Update metadata
- `GET /api/images/*/preview` - Get image thumbnail
- `POST /api/images/*/rename` - Rename image with SEO filename
- `GET /api/images/export/wordpress` - Export CSV for WordPress

## File Structure

```
optimized/
  YYYY/
    MM/
      DD/
        optimized-images.webp

originals/
  YYYY/
    MM/
      DD/
        original-images.jpg

.metadata/
  image-metadata.json
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=DEBUG
MAX_FILE_SIZE=52428800
MAX_FILES_PER_REQUEST=20
```

See `.env.example` for all options.

## Testing

- **Test Coverage**: 97%+ (127 tests)
- **Integration Tests**: Build and runtime verification
- **Unit Tests**: All core modules

Run `bun test:coverage` for detailed coverage report.

## Security

- ✅ Path traversal prevention
- ✅ Input sanitization
- ✅ File type validation
- ✅ File size limits
- ✅ Error message sanitization
- ✅ CORS configured

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-31
