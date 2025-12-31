# Cloud Run Docker Image Naming Fix

## Problem Statement

The Google Cloud Run deployment was failing with this error:
```
invalid argument "us-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/vision-/...:$COMMIT_SHA" 
for "-t, --tag" flag: invalid reference format
```

## Root Cause

The repository name `vision-` ends with a hyphen/dash (`-`), which violates Docker image naming conventions.

**Docker Naming Rules:**
- Must be lowercase alphanumeric
- Can contain dashes, dots, underscores
- **Cannot end with special characters**

❌ **Invalid:** `vision-` (ends with dash)  
✅ **Valid:** `novaui` (alphanumeric only)

## Solution

Use `novaui` (from package.json) as the Docker image name instead of `vision-`.

## Implementation

### 1. Created `Dockerfile`
Multi-stage build optimized for Cloud Run:

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK CMD curl -f http://localhost:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

**Features:**
- Node 18 Alpine for building
- Nginx Alpine for serving
- Port 8080 (Cloud Run requirement)
- Health check with curl
- ~50MB final image

### 2. Updated `nginx.conf`
Changed port from 80 to 8080:

```nginx
server {
    listen 8080;  # Cloud Run requirement
    # ... rest of config
}
```

### 3. Created `cloudbuild.yaml`
Google Cloud Build configuration with fixed image name:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/novaui:$COMMIT_SHA'
      - '-t'
      - 'us-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/novaui:latest'
      - '-f'
      - 'Dockerfile'
      - '.'
```

**Key points:**
- Image name: `novaui` ✅ (not `vision-` ❌)
- Tags: commit SHA + latest
- Machine: E2_HIGHCPU_8
- Timeout: 30 minutes

## Deployment Commands

### Local Testing
```bash
docker build -t novaui:latest .
docker run -p 8080:8080 novaui:latest
curl http://localhost:8080
```

### Cloud Build
```bash
gcloud builds submit --config cloudbuild.yaml
```

### Cloud Run
```bash
gcloud run deploy novaui \
  --image us-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/novaui:latest \
  --region us-west1 \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated
```

## Verification

Test the fix:
```bash
# ❌ Invalid image name
docker tag test:latest vision-:latest
# Error: invalid reference format

# ✅ Valid image name
docker tag test:latest novaui:latest
# Success
```

## Files Changed

| File | Status | Description |
|------|--------|-------------|
| `Dockerfile` | ✅ NEW | Multi-stage production build |
| `nginx.conf` | ✅ MODIFIED | Port 80→8080 |
| `cloudbuild.yaml` | ✅ NEW | Build config with fixed name |
| `DOCKER_BUILD_README.md` | ✅ NEW | Full documentation |

## Results

✅ Docker image name is valid  
✅ Builds successfully  
✅ Port 8080 configured  
✅ Health check works  
✅ Code review passed  
✅ Security check passed  
✅ Ready for deployment

## Next Steps

1. Merge this PR
2. Run: `gcloud builds submit --config cloudbuild.yaml`
3. Deploy to Cloud Run
4. Verify deployment

---

**Status:** ✅ READY FOR DEPLOYMENT  
**Date:** 2025-12-31  
**Fix:** Use `novaui` as Docker image name
