# 🚀 NovaUI Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Build succeeds locally

### Environment Configuration
- [ ] `.env.local` configured with all required variables
- [ ] API keys tested and validated
- [ ] Database connection tested (if using Supabase)
- [ ] Stripe webhooks configured (if using payments)

### Documentation
- [ ] README.md updated
- [ ] API documentation complete
- [ ] Deployment guides reviewed

## Deployment Steps

### Railway Deployment

#### Frontend Service
- [ ] Create new Railway project
- [ ] Connect GitHub repository
- [ ] Set root directory to `/`
- [ ] Add environment variables from `.env.example`
- [ ] Deploy and verify build
- [ ] Test deployed URL

#### Backend Services (for each service)
- [ ] Create service: `novaui-gateway`
- [ ] Set root directory: `server/blade-gateway`
- [ ] Add environment variables:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `CORS_ALLOWED_ORIGINS`
- [ ] Deploy and check logs
- [ ] Test health endpoint

#### PostgreSQL Database
- [ ] Add PostgreSQL plugin
- [ ] Run database migrations
- [ ] Verify connection from backend services

### Post-Deployment

- [ ] Frontend loads correctly
- [ ] Backend APIs responding
- [ ] Authentication working
- [ ] Database queries successful
- [ ] No errors in logs
- [ ] SSL/HTTPS enabled
- [ ] Custom domain configured (optional)

## Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Create deployment alerts

## Rollback Plan

If deployment fails:
1. Revert to previous GitHub commit
2. Railway auto-deploys previous version
3. Check logs for error details
4. Fix issues locally
5. Re-deploy

## Support

- Railway Status: https://status.railway.app
- NovaUI Docs: [Link to docs]
- GitHub Issues: https://github.com/v3ai2026/vision-/issues
