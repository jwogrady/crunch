#!/bin/bash
# Railway build script - ensures frontend is built

set -e

echo "🔧 Installing dependencies..."
bun install

echo "🏗️  Building frontend..."
bun run build

echo "✅ Build complete!"
ls -la src/web/dist/ || echo "⚠️  Warning: dist directory not found after build"

