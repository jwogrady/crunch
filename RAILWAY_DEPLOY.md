# Railway Deployment - Single Service (Option A) ⭐

**Recommended deployment method:** One Railway service that builds frontend and runs Bun backend, serving everything from a single URL.

## ✅ Why Option A?

- ✅ **Simplest setup** - One service to manage
- ✅ **No CORS issues** - Same origin for frontend and backend
- ✅ **Lower cost** - Single service vs two
- ✅ **Easier configuration** - Fewer moving parts
- ✅ **Automatic static serving** - Backend serves built frontend

## 🚀 Quick Deploy (5 minutes)

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

This opens your browser to authenticate.

### 3. Initialize Project

```bash
railway init
```

This will:
- Create a new Railway project (or link to existing)
- Auto-detect Bun runtime
- Link your repository
- Create `.railway/` directory

### 4. Configure Build & Start Commands

Railway will use the configuration from `railway.toml`:

**Build Command:**
```bash
bun install && bun run build
```

**Start Command:**
```bash
bun run src/server.ts
```

**Important**: The `railway.toml` file must have `buildCommand` set. If not, the frontend won't be built and you'll see warnings about missing `src/web/dist`.

The server automatically serves static files from `src/web/dist` in production.

### 5. Set Environment Variables

In Railway dashboard → Your Service → Variables, add:

```env
NODE_ENV=production
LOG_LEVEL=INFO
MAX_FILE_SIZE=52428800
MAX_FILES_PER_REQUEST=20
CACHE_MAX_SIZE=1000
CACHE_TTL=3600000
```

**Note:** Railway automatically sets `PORT` - your server uses it via `process.env.PORT`.

### 6. Deploy!

```bash
railway up
```

Or commit and push (if GitHub connected):

```bash
git add .
git commit -m "chore: configure Railway deployment"
git push
```

Railway will automatically deploy on push!

## 📋 What Happens During Deploy

1. **Build Phase** (`railway-build.sh`):
   - Install dependencies: `bun install`
   - Build frontend: `bun run build` → Creates `src/web/dist/`

2. **Start Phase**:
   - Start backend: `bun run src/server.ts`
   - If `dist/` missing, server attempts auto-build (fallback)
   
3. **Backend serves:**
   - API routes (`/api/*`, `/optimize`, `/download/*`)
   - Static files from `src/web/dist/` (HTML, JS, CSS, assets)
   - SPA routing (all non-API routes → `index.html`)

**Note:** The server has a fallback that builds the frontend if `src/web/dist/` is missing, ensuring it works even if Railway's build phase is skipped.

## 🌐 Getting Your URL

After deployment:

```bash
railway domain
```

Or check Railway dashboard → Settings → Domains

You'll get a URL like: `https://your-app.railway.app`

## ✅ Verify Deployment

### 1. Check Backend API

```bash
curl https://your-app.railway.app/api/images
```

Should return: `[]` (empty array, or list of images if any)

### 2. Check Frontend

Open in browser: `https://your-app.railway.app`

Should show your React app!

### 3. Check Health

```bash
curl https://your-app.railway.app/api/images
```

Should return JSON (empty array or image list)

## 🔧 Configuration Files

### `railway.toml` (Auto-generated)

Railway creates this automatically, but you can customize:

```toml
[build]
  builder = "NIXPACKS"
  
[deploy]
  startCommand = "bun run src/server.ts"
  healthcheckPath = "/api/images"
  healthcheckTimeout = 100
```

### `package.json` Scripts

Already configured:
- `build:railway` - Build frontend
- `deploy:railway` - Deploy to Railway
- `start` - Start server (production)

## 📁 File Structure

```
your-project/
├── railway.toml          # Railway config (auto-generated)
├── src/
│   ├── server.ts        # Backend (serves static in prod)
│   └── web/
│       ├── dist/        # Built frontend (created by build)
│       ├── App.tsx
│       └── ...
├── optimized/           # Optimized images (persistent)
├── originals/           # Original images (persistent)
├── .metadata/           # Metadata files (persistent)
└── package.json
```

## 🎯 How Static File Serving Works

In production (`NODE_ENV=production`), the server:

1. **Checks for** `src/web/dist/` directory
2. **Serves static files** for non-API routes
3. **SPA routing:** All routes → `index.html` (React Router handles client-side routing)
4. **API routes** take priority (`/api/*`, `/optimize`, `/download/*`)

Example:
- `/` → `src/web/dist/index.html`
- `/api/images` → API endpoint (handled by Elysia)
- `/assets/logo.png` → `src/web/dist/assets/logo.png`
- `/gallery` → `src/web/dist/index.html` (SPA routing)

## 💾 Persistent Storage

Railway provides persistent storage for:
- `optimized/` - Optimized images
- `originals/` - Original images  
- `.metadata/` - Image metadata

These persist across deployments.

To configure volumes in Railway:
1. Dashboard → Your Service → Settings
2. Add Volume
3. Mount to `/app/optimized`, `/app/originals`, `/app/.metadata`

## 🔄 Continuous Deployment

Railway automatically deploys when you:

1. **Push to GitHub** (if connected)
2. **Run** `railway up` manually
3. **Trigger** via Railway dashboard

Configure auto-deploy in:
- Railway Dashboard → Settings → Source
- Connect your GitHub repo
- Select branch (usually `main`)

## 📊 Monitoring

Railway provides:

- **Metrics:** CPU, Memory, Network usage
- **Logs:** Real-time application logs
- **Deployments:** History and status
- **Alerts:** Configure in dashboard

Access via Railway dashboard → Your Service

## 🐛 Troubleshooting

### Frontend Not Loading?

**Check:**
1. Build completed? → Check Railway build logs
2. `src/web/dist/` exists? → Should be created by `bun run build`
3. Server logs show: `Static file serving enabled from: src/web/dist`

**Fix:**
```bash
# Verify build works locally
bun run build

# Check if dist exists
ls -la src/web/dist/
```

### API Not Working?

**Check:**
1. Environment variables set? → Railway dashboard → Variables
2. Port configuration? → Railway sets `PORT` automatically
3. Check server logs → Railway dashboard → Logs

### Build Fails?

**Check:**
1. Bun detected? → Railway should auto-detect
2. Dependencies? → Ensure `package.json` has all deps
3. Build logs → Railway dashboard → Deployments → View logs

**Common fixes:**
```bash
# Verify locally
bun install
bun run build
```

### Port Issues?

Railway automatically sets `PORT`. Your server uses:

```typescript
const port = process.env.PORT || 3000;
```

Don't hardcode the port!

## 🌍 Custom Domain

Add custom domain:

1. Railway Dashboard → Settings → Domains
2. Add custom domain
3. Configure DNS (Railway provides instructions)
4. Railway automatically provisions SSL certificate

## 💰 Pricing

Railway pricing:
- **Free tier:** $5/month credit
- **Hobby:** Pay-as-you-go after credit
- **Pro:** $20/month + usage

Single service = **1 service** = Lower cost!

## 🚀 Next Steps

1. ✅ Deploy using steps above
2. ✅ Verify frontend and API work
3. ✅ Set up custom domain (optional)
4. ✅ Configure monitoring/alerts (optional)
5. ✅ Set up CI/CD for auto-deploy (optional)

## 📚 Related Docs

- `RAILWAY_FULL_STACK.md` - Alternative two-service setup
- `DEPLOY.md` - Other deployment options
- `BUN_DEPLOYMENT.md` - Platform comparison

---

**Ready to deploy? Run:**

```bash
railway login
railway init
railway up
```

That's it! 🎉

