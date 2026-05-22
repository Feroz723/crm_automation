# Deployment Guide

## Prerequisites

- Vercel account (for frontend)
- Cloudflare account (for workers, optional)
- Supabase account (for database)
- Domain name (optional, recommended for production)

## Part 1: Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - Name: `ai-lead-crm`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users
4. Wait for project to be provisioned (~2 minutes)

### 2. Get Connection Strings

1. Go to Project Settings → Database
2. Copy:
   - **Connection string (URI)** → `DATABASE_URL`
   - **Direct connection string** → `DIRECT_URL`
3. Replace `[YOUR-PASSWORD]` with your database password

### 3. Push Prisma Schema

```bash
npx prisma generate
npx prisma db push
```

This creates all tables in your Supabase database.

### 4. Set Up RLS Policies (Optional but recommended)

```sql
-- Enable RLS on tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything" ON leads
FOR ALL USING (true);

-- Add user-specific policies as needed
```

### 5. Get API Keys

1. Go to Project Settings → API
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

## Part 2: AI Services Setup

### 1. Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / Log in
3. Navigate to API Keys
4. Create new API key
5. Copy → `GROQ_API_KEY`

### 2. Google Gemini API Key

1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy → `GEMINI_API_KEY`

### 3. HubSpot API Key (Optional)

1. Log in to HubSpot
2. Go to Settings → Integrations → API Key
3. Create / Copy API key → `HUBSPOT_API_KEY`

## Part 3: Frontend Deployment (Vercel)

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit: AI Lead Gen CRM"
git remote add origin https://github.com/yourusername/ai-lead-crm.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Add Environment Variables

In Vercel dashboard, go to Settings → Environment Variables:

```env
# Database
DATABASE_URL=your_supabase_connection_string
DIRECT_URL=your_supabase_direct_connection_string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (secret!)

# AI
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# CRM (optional)
HUBSPOT_API_KEY=pat-...
HUBSPOT_PORTAL_ID=12345678

# App URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
INTEGRATION_TOKEN_SECRET=another-secret-key-for-tokens
```

### 4. Deploy

Click "Deploy" and wait for build to complete (~2-3 minutes).

### 5. Test Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Navigate to `/dashboard/leads`
3. Test API endpoint: `curl https://your-app.vercel.app/api/leads`

## Part 4: Cloudflare Workers (Optional Webhook Handler)

If you want to use Cloudflare Workers for webhooks instead of Next.js API routes:

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Configure Secrets

```bash
cd workers
wrangler secret put GROQ_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put DATABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### 4. Deploy Worker

```bash
wrangler deploy
```

### 5. Get Worker URL

Copy the deployed URL (e.g., `https://webhook.your-subdomain.workers.dev`)

Update `NEXT_PUBLIC_WEBHOOK_URL` environment variable in Vercel.

## Part 5: Custom Domain (Optional)

### In Vercel:

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS to propagate (~5-60 minutes)

### Update Environment Variables:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_WEBHOOK_URL=https://your-domain.com/api/leads
```

## Part 6: Post-Deployment Checklist

- [ ] Test frontend loads at your domain
- [ ] Test API: `curl -X POST https://your-domain.com/api/leads -H "Content-Type: application/json" -d '{"source":"manual","email":"test@test.com"}'`
- [ ] Check lead appears in dashboard
- [ ] View webhook logs at `/dashboard/logs`
- [ ] Generate integration token at `/dashboard/settings`
- [ ] Test AI enrichment with a real lead
- [ ] Test HubSpot sync (if configured)
- [ ] Set up monitoring (Vercel Analytics, Sentry, etc.)

## Part 7: Monitoring & Maintenance

### Vercel Analytics

Enable in Project Settings → Analytics

### Error Tracking (Optional)

Install Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Database Backups

Supabase automatically backs up your database. Enable Point-in-Time Recovery (PITR) for production.

### Performance Optimization

1. Enable Vercel Edge Functions for `/api/leads` endpoint
2. Add Redis caching for analytics queries
3. Optimize images with Next.js Image component
4. Enable Vercel Speed Insights

## Troubleshooting

### Build Fails

- Check Node.js version (needs 18+)
- Verify all environment variables are set
- Check prisma generate ran successfully

### API Errors

- Verify DATABASE_URL is correct
- Check Supabase firewall allows Vercel IPs
- Review logs in Vercel dashboard

### AI Not Working

- Verify GROQ_API_KEY and GEMINI_API_KEY are valid
- Check API quotas/limits
- Review function logs for errors

### Webhook Issues

- Test with curl first
- Check CORS settings
- Verify integration token is active
- Review webhook logs in dashboard

## Scaling Considerations

### Database

- Upgrade Supabase plan for more connections
- Add read replicas for analytics queries
- Enable connection pooling

### API

- Use Vercel Edge Functions for low latency
- Implement rate limiting
- Add Redis for caching

### AI

- Implement request queuing for high volume
- Cache common AI responses
- Consider upgrading to Groq Pro

## Security

- ✅ All secrets stored as environment variables
- ✅ RLS policies on database tables
- ✅ API authentication with integration tokens
- ✅ HTTPS enforced
- ⚠️ Add rate limiting for production
- ⚠️ Implement CORS restrictions
- ⚠️ Enable Vercel firewall

## Support

For issues during deployment:
- Check Vercel deployment logs
- Review Supabase logs
- Test API endpoints with curl
- Open GitHub issue with error details

---

**Deployment Complete! 🎉**

Your AI Lead Gen CRM is now live and ready to capture leads!
