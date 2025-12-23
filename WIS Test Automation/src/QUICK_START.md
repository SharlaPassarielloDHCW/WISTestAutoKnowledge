# ⚡ Quick Start - Fix the "Failed to fetch" Errors

## 🔴 Problem
You're seeing these errors in the browser console:
```
Error fetching documents: TypeError: Failed to fetch
Error fetching posts: TypeError: Failed to fetch
Error fetching UI structure: TypeError: Failed to fetch
```

## ✅ Solution
**You need to deploy the backend server to Supabase first!**

---

## 🚀 Quick Deploy (3 Steps)

### 1️⃣ Install Supabase CLI
```bash
npm install -g supabase
```

### 2️⃣ Login & Link
```bash
supabase login
supabase link --project-ref euiiwbaymjvykzvtzzfp
```

### 3️⃣ Deploy the Function
```bash
supabase functions deploy make-server-4343c471
```

---

## ✅ Verify It Worked

Open this URL in your browser:
```
https://euiiwbaymjvykzvtzzfp.supabase.co/functions/v1/make-server-4343c471/health
```

You should see: `{"status":"ok"}`

Then **reload your application** - the errors will be gone! 🎉

---

## 📖 Need More Details?

See the full deployment guide: [SUPABASE_DEPLOYMENT.md](./SUPABASE_DEPLOYMENT.md)

---

## 💡 What's Happening?

Your React frontend is trying to call your Supabase backend API, but the backend code hasn't been deployed yet. The code exists in `/supabase/functions/make-server-4343c471/` but needs to be uploaded to Supabase's servers.

Once deployed, all your features will work:
- ✅ Document uploads
- ✅ Community discussions
- ✅ Project structure
- ✅ Real-time multi-user sync

---

## 🆘 Having Issues?

**Can't install Supabase CLI?**
- Try: `brew install supabase/tap/supabase` (macOS)
- Or see: https://supabase.com/docs/guides/cli/getting-started

**Don't have the database password?**
- Go to: https://supabase.com/dashboard/project/euiiwbaymjvykzvtzzfp/settings/database

**Still getting errors?**
- Check the logs: `supabase functions logs make-server-4343c471 --follow`
- Open an issue with the error message

---

That's it! Deploy once and everything works. 🚀
