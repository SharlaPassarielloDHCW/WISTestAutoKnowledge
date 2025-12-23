# 🚀 Supabase Edge Function Deployment Guide

## ⚠️ IMPORTANT: Deploy the Backend Server to Fix the Errors!

The errors you're seeing occur because **the Supabase Edge Function hasn't been deployed yet**.

**Current Errors:**
```
Error fetching documents: TypeError: Failed to fetch
Error fetching posts: TypeError: Failed to fetch
Error fetching UI structure: TypeError: Failed to fetch
Error fetching API structure: TypeError: Failed to fetch
Error loading search data from API: TypeError: Failed to fetch
```

**Why?** Your frontend is trying to call the API at:
```
https://euiiwbaymjvykzvtzzfp.supabase.co/functions/v1/make-server-4343c471/*
```

But the server code hasn't been uploaded to Supabase yet. Let's fix this!

---

## 📋 Prerequisites

1. **Install Supabase CLI:**
   ```bash
   # macOS/Linux
   brew install supabase/tap/supabase
   
   # Windows (use Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # Or use NPM (all platforms)
   npm install -g supabase
   ```

2. **Verify installation:**
   ```bash
   supabase --version
   ```

---

## 🔑 Step 1: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate. Follow the prompts to login.

---

## 📦 Step 2: Link Your Project

From your project directory, link to your Supabase project:

```bash
supabase link --project-ref euiiwbaymjvykzvtzzfp
```

When prompted for the database password, you can find it in your Supabase dashboard:
- Go to: https://supabase.com/dashboard/project/euiiwbaymjvykzvtzzfp/settings/database
- Look for "Database password" or use the password you set when creating the project

---

## 🚀 Step 3: Deploy the Edge Function

Deploy the server function to Supabase:

```bash
supabase functions deploy make-server-4343c471
```

**Note:** The function name is `make-server-4343c471` (without the `/server` part).

If you get an error about the function structure, you may need to reorganize the files:

```bash
# The Supabase CLI expects this structure:
# supabase/functions/make-server-4343c471/index.ts

# You currently have:
# supabase/functions/server/index.tsx

# You have two options:
```

### Option A: Rename the folder
```bash
mv supabase/functions/server supabase/functions/make-server-4343c471
```

### Option B: Deploy with the current structure
```bash
# If the folder is named "server", deploy it as:
supabase functions deploy server

# Then update the API URLs in /utils/api.ts to use /server instead of /make-server-4343c471
```

---

## ✅ Step 4: Verify Deployment

After deployment, test that the server is working:

```bash
curl https://euiiwbaymjvykzvtzzfp.supabase.co/functions/v1/make-server-4343c471/health
```

You should see:
```json
{"status":"ok"}
```

---

## 🔄 Step 5: Refresh Your Application

1. Reload your web application in the browser
2. The errors should disappear
3. All features should work (documents, community, project structure)

---

## 🛠️ Common Issues & Solutions

### Issue: "Function not found"
**Solution:** Make sure the function name matches the route prefix in your code.

### Issue: "Invalid JWT" or "Authentication failed"
**Solution:** Check that your `SUPABASE_ANON_KEY` is correct in `/utils/supabase/info.tsx`

### Issue: "CORS errors"
**Solution:** The server code already includes CORS headers. Make sure you deployed the latest version.

### Issue: "Module not found" errors during deployment
**Solution:** The Edge Function runtime uses Deno. All imports should use:
- `npm:package` for NPM packages (e.g., `npm:hono`)
- `jsr:package` for JSR packages
- These are already configured correctly in your `index.tsx`

---

## 📊 Step 6: Monitor Your Function

View logs in real-time:

```bash
supabase functions logs make-server-4343c471 --follow
```

Or view in the dashboard:
https://supabase.com/dashboard/project/euiiwbaymjvykzvtzzfp/functions/make-server-4343c471/logs

---

## 🔄 Updating the Function

Whenever you make changes to `/supabase/functions/server/index.tsx`, redeploy:

```bash
supabase functions deploy make-server-4343c471
```

Changes are live immediately (no restart needed).

---

## 🎯 Quick Deploy Checklist

- [ ] Install Supabase CLI
- [ ] Login: `supabase login`
- [ ] Link project: `supabase link --project-ref euiiwbaymjvykzvtzzfp`
- [ ] Deploy function: `supabase functions deploy make-server-4343c471`
- [ ] Test health endpoint
- [ ] Reload application in browser
- [ ] Verify no more errors

---

## 💡 Alternative: Use Supabase Dashboard

If you prefer not to use the CLI, you can deploy via the Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/euiiwbaymjvykzvtzzfp/functions
2. Click "Create a new function"
3. Name it: `make-server-4343c471`
4. Copy the entire contents of `/supabase/functions/server/index.tsx`
5. Paste into the editor
6. Create another file in the function called `kv_store.tsx`
7. Copy the entire contents of `/supabase/functions/server/kv_store.tsx`
8. Click "Deploy"

---

## 📞 Need Help?

- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **Supabase CLI Docs:** https://supabase.com/docs/reference/cli/introduction
- **Edge Functions Guide:** https://supabase.com/docs/guides/functions/deploy

---

## 🎉 After Deployment

Once deployed, your application will have:
- ✅ Persistent multi-user database storage
- ✅ Real-time data synchronization
- ✅ Document uploads that all team members can see
- ✅ Shared community discussions
- ✅ Collaborative project structure editing

All without needing to sign in - it just works! 🚀