# Quick Start Guide

## 🚀 How to Run the Image Optimizer App

### Prerequisites

Make sure you have Bun installed:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation

```bash
# Install dependencies
bun install
```

### Running the App

#### Option 1: Run Everything at Once (Recommended)

```bash
bun run dev:all
```

This starts:
- **Backend server** on `http://localhost:3000`
- **Frontend dev server** on `http://localhost:5173`

Open your browser to: **http://localhost:5173**

#### Option 2: Run Backend and Frontend Separately

**Terminal 1 - Backend:**
```bash
bun run dev
```
Server runs at: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
bun run dev:frontend
```
Frontend runs at: `http://localhost:5173`

### Access the App

1. Open your browser to **http://localhost:5173**
2. You'll see two tabs:
   - **Optimize Images** - Upload and optimize images
   - **Gallery & Management** - View, edit, and manage optimized images

### Usage

#### Optimize Images Tab
1. Click "Upload Images" and select image files
2. Adjust settings:
   - **Width**: Target width in pixels (default: 1600)
   - **Quality**: Compression quality 1-100 (default: 85)
   - **Format**: WebP, JPEG, or Both
3. Click "Optimize Images"
4. Download individual files or "Download All as ZIP"

#### Gallery & Management Tab
1. View all optimized images
2. Click an image to:
   - See preview and metadata
   - Edit SEO fields (title, alt text, description, etc.)
   - Rename with SEO-optimized filename
   - Export metadata for WordPress

### API Endpoints

The backend server provides these endpoints:

- `POST /optimize` - Optimize uploaded images
- `GET /download/:file` - Download a specific optimized image
- `GET /download-all` - Download all optimized images as ZIP
- `GET /api/images` - List all images with metadata
- `GET /api/images/*/metadata` - Get metadata for specific image
- `PUT /api/images/*/metadata` - Update image metadata
- `GET /api/images/*/preview` - Get image thumbnail
- `POST /api/images/*/rename` - Rename image with SEO filename
- `GET /api/images/export/wordpress` - Export CSV for WordPress

### File Structure

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

### Troubleshooting

**Port already in use?**
```bash
# Backend uses port 3000, frontend uses 5173
# Kill processes using those ports:
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**Dependencies not installed?**
```bash
bun install
```

**Build errors?**
```bash
# Verify everything compiles
bun test
```

### Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### Production Build

```bash
# Build frontend
bunx vite build

# Run production server
bun run dev
```

