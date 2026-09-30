# Deployment Guide — Dokploy

## Platform Information
- **Platform:** Dokploy (self-hosted)
- **Server:** https://host.vnggames.ai
- **Project:** KieuVC
- **Environment:** production
- **App Name:** ai-interview-app
- **App ID:** trrIEU5c5fmgbqK8Kfn96

## Current Deployment Status
- **Branch:** feature/job-library-schema
- **Repository:** Kieuvc-vng/AIterview
- **Build Type:** Nixpacks
- **Auto Deploy:** Enabled (deploys on push)
- **Port:** 3000

## How to Deploy

### Option 1: Automatic Deploy (Recommended)
App is set to auto-deploy on push. Simply:
1. Push code to `feature/job-library-schema` branch
2. Dokploy will automatically build and deploy

### Option 2: Manual Deploy
```bash
dokploy app deploy -a trrIEU5c5fmgbqK8Kfn96 -p 8P2aSiGlEe3q1dyWGZnnz -e EzZbDERoS0v2XGrqLu6YA -y
```

## Environment Variables
The following variables are configured:
- `QWEN_API_KEY`: API key for Qwen AI model
- `QWEN_MODEL`: Qwen model identifier
- `QWEN_API_BASE_URL`: Base URL for Qwen API
- `NODE_ENV`: Set to `production`
- `PORT`: Set to `3000`

## Viewing Logs & Status

1. Visit: https://host.vnggames.ai
2. Navigate to: KieuVC project → ai-interview-app
3. Check the deployment logs to see build output and errors

## Database
- **Type:** SQLite
- **Location:** interview.db (created in container)
- **Persistence:** Configured via Dokploy volume mounts

## Troubleshooting

### Status shows "error"
1. Check logs in Dokploy web UI
2. Common issues:
   - Missing environment variables
   - Port 3000 not available
   - Health check timeout
   - Build failure (check Dockerfile)

### Build Fails
- Check that all dependencies are listed in `package.json`
- Ensure Dockerfile is valid (located in repo root)
- Check node version compatibility

### Health Check Fails
- App needs a `/health` endpoint or modify HEALTHCHECK in Dockerfile
- Currently configured endpoint: `http://localhost:3000/health`

## Next Steps

1. **Monitor deployment:** Watch logs on Dokploy UI
2. **Add domain:** Configure domain/DNS if needed
3. **Set up SSL:** Configure in Dokploy settings
4. **Backup database:** Consider volume backups for interview.db

---
Generated with [Claude Code](https://claude.com/claude-code)
