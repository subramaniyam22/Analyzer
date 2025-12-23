# Render Deployment Troubleshooting Guide

## Current Status
The application has been deployed to Render but registration is failing with 500 errors.

## Services That Should Be Running
1. ✅ `analyzer-db` (PostgreSQL) - Basic-1gb plan
2. ✅ `analyzer-redis` (Redis) - Starter plan  
3. ❓ `analyzer-backend` (FastAPI) - Free plan
4. ❓ `analyzer-frontend` (Next.js) - Free plan
5. ❓ `analyzer-worker` (Celery) - Starter plan

## Diagnostic Steps

### Step 1: Verify Backend is Running
Open in browser: `https://analyzer-backend.onrender.com/health`

**Expected Response:**
```json
{"status":"healthy","service":"analyzer-backend"}
```

**If you get an error:**
- Backend is not running properly
- Check Render Dashboard → `analyzer-backend` → Logs for errors

### Step 2: Check Backend Logs
Go to: Render Dashboard → `analyzer-backend` → Logs

**Look for these messages:**
```
🚀 Starting Analyzer Backend...
✓ Backend is ready to accept requests

==================================================
Database initialization attempt 1/5
==================================================
✓ Vector extension ready
✓ Database tables ready
==================================================
✅ Database initialization complete!
==================================================
```

**If you see errors instead:**
- Note the exact error message
- Common issues:
  - Database connection failed
  - Missing environment variables
  - Import errors

### Step 3: Verify Environment Variables
Go to: Render Dashboard → `analyzer-backend` → Environment

**Required variables:**
- `DATABASE_URL` - Should be auto-populated from database
- `REDIS_URL` - Should be auto-populated from Redis
- `SECRET_KEY` - Should be auto-generated
- `OPENAI_API_KEY` - You need to add this manually

**Action:** If `OPENAI_API_KEY` is missing, add it now.

### Step 4: Check Frontend Environment
Go to: Render Dashboard → `analyzer-frontend` → Environment

**Required variables:**
- `BACKEND_URL` - Should be auto-populated (value: `analyzer-backend.onrender.com`)
- `NODE_VERSION` - Should be `20.11.0`

### Step 5: Test Direct Backend API Call
Try this in your browser or Postman:

**URL:** `https://analyzer-backend.onrender.com/auth/register`
**Method:** POST
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "email": "test@example.com",
  "full_name": "Test User",
  "password": "testpass123",
  "role": "user"
}
```

**Expected:** Success response or specific error message

## Common Issues and Fixes

### Issue 1: Backend Not Starting
**Symptoms:** Health check fails, logs show startup errors

**Fix:**
1. Check logs for specific error
2. Verify DATABASE_URL is set
3. Ensure all dependencies in requirements.txt are compatible

### Issue 2: Database Connection Failed
**Symptoms:** Logs show "could not connect to database"

**Fix:**
1. Verify `analyzer-db` is running (status: Available)
2. Check DATABASE_URL environment variable is set
3. Ensure database is in same region as backend

### Issue 3: Frontend Can't Reach Backend
**Symptoms:** Registration works via direct API call but not through frontend

**Fix:**
1. Verify `BACKEND_URL` environment variable on frontend
2. Check Next.js rewrites in `next.config.ts`
3. Ensure frontend has redeployed after environment variable changes

### Issue 4: CORS Errors
**Symptoms:** Browser console shows CORS policy errors

**Fix:**
1. Backend has `allow_origins=["*"]` - should work
2. If still failing, backend might not be responding at all
3. Check backend logs for incoming requests

## Next Steps

1. **Go through Steps 1-5 above** and note what you find
2. **Share screenshots** of:
   - Backend logs (last 50 lines)
   - Backend environment variables page
   - Frontend environment variables page
   - Services status page showing all 5 services

3. **Try the direct API call** (Step 5) and share the response

This will help identify the exact point of failure.
