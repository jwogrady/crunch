# Deployment Guide

## 🚀 Recommended: Railway Single Service Deployment (Option A)

**Deploy both frontend and backend on Railway in one service** - See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for complete guide.

**Quick Start:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Railway auto-detects Bun, builds frontend, and serves both backend API and frontend from a single service.

---

## Deployment Options

### Railway Single Service ⭐ (Recommended)

**Best for:** Production deployment with full Bun backend

Deploy both frontend and backend on Railway in a single service.

**See:** [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for complete guide.

**Quick Steps:**
1. `npm install -g @railway/cli`
2. `railway login`
3. `railway init`
4. Set environment variables in Railway dashboard
5. `railway up`

## Configuration

### Railway Settings

Railway auto-detects Bun and configures:
- Build command: `bun install && bun run build`
- Start command: `bun run src/server.ts`
- Automatic static file serving from `src/web/dist`

### Build Script

The build script in `package.json`:
```json
"build": "bunx vite build"
```

This builds the frontend React app for production.

## Environment Variables

Set in Railway dashboard → Variables:

```
NODE_ENV=production
LOG_LEVEL=INFO
MAX_FILE_SIZE=52428800
MAX_FILES_PER_REQUEST=20
CACHE_MAX_SIZE=1000
CACHE_TTL=3600000
```

**Note:** Railway automatically sets `PORT` - your server uses it via `process.env.PORT`.

## Other Bun-Compatible Platforms

If you prefer other platforms:
- **Render** - Supports Bun runtime
- **Fly.io** - Supports Bun runtime  
- **DigitalOcean App Platform** - Supports Bun runtime

### Other Bun-Compatible Platforms

- **Render** - Easy deployment, free tier, native Bun support
- **Fly.io** - Global edge distribution, Docker-based
- **DigitalOcean App Platform** - Enterprise features, Bun runtime

All platforms support Bun natively, making deployment straightforward.

---

**Ready to deploy!** Follow the Railway guide above to get started.

