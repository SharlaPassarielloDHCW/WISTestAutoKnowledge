# WIS Knowledge Hub - Deployment Guide

## Overview
Your WIS Test Automation Knowledge Hub is now **fully configured** with Supabase backend for multi-user functionality. This guide will help you deploy it.

## What's Been Set Up

### Backend Infrastructure
✅ **Supabase Edge Functions Server** - Handles all API requests  
✅ **REST API Endpoints** for:
- Documents (upload, download, delete)
- Project Structure (UI & API repositories)
- Community Posts & Comments

✅ **Persistent Database Storage** - Uses Supabase's key-value store  
✅ **Real-time Data Sync** - Polls API every 3 seconds for updates  
✅ **Multi-user Support** - All team members see shared data

### Complete API Integration
✅ `/App.tsx` - Updated to load all data from API
✅ `/components/DocumentsPage.tsx` - Fully API integrated
✅ `/components/ProjectStructure.tsx` - Fully API integrated
✅ `/components/CommunityPage.tsx` - Fully API integrated
✅ `/utils/api.ts` - Complete API client library

### Files Modified/Created
- `/supabase/functions/server/index.tsx` - Complete API server with 10+ endpoints
- `/utils/api.ts` - Frontend API client
- `/App.tsx` - API-powered data loading with 3-second polling
- `/components/DocumentsPage.tsx` - Full API integration
- `/components/ProjectStructure.tsx` - Full API integration
- `/components/CommunityPage.tsx` - Full API integration

---

## ✅ Migration Complete - Ready for Deployment!

All components now use Supabase instead of localStorage. Your application is ready to be deployed as a multi-user knowledge hub!

---

## Deployment Steps

### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist` folder with optimized static files.

---

### Step 2: Choose Your Deployment Method

#### **Option A: IIS (Recommended for Windows/NHS)**

1. **Copy files to IIS server:**
   ```
   C:\inetpub\wwwroot\wis-knowledge-hub\
   ```

2. **Create `web.config` in the root directory:**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="React Routes" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

3. **Configure IIS:**
   - Open IIS Manager
   - Create new website
   - Set physical path to your dist folder
   - Bind to internal hostname (e.g., `wis-hub.internal.nhs.wales`)
   - Ensure IIS_IUSRS has read permissions

#### **Option B: Nginx (Linux)**

1. **Copy files:**
   ```bash
   sudo cp -r dist/* /var/www/wis-knowledge-hub/
   ```

2. **Create Nginx config** (`/etc/nginx/sites-available/wis-knowledge-hub`):
   ```nginx
   server {
       listen 80;
       server_name wis-hub.internal.nhs.wales;
       root /var/www/wis-knowledge-hub;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

3. **Enable site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/wis-knowledge-hub /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

#### **Option C: Node.js with PM2 (Quick Setup)**

1. **Create `server.js` in project root:**
   ```javascript
   const express = require('express');
   const path = require('path');
   const app = express();

   app.use(express.static(path.join(__dirname, 'dist')));

   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'dist', 'index.html'));
   });

   const PORT = process.env.PORT || 3000;
   app.listen(PORT, '0.0.0.0', () => {
     console.log(`WIS Knowledge Hub running on http://0.0.0.0:${PORT}`);
   });
   ```

2. **Install and run:**
   ```bash
   npm install express
   npm install -g pm2
   pm2 start server.js --name wis-hub
   pm2 startup
   pm2 save
   ```

---

### Step 3: Network Configuration

1. **Internal DNS Entry:**
   - Add DNS record: `wis-hub.internal.nhs.wales` → `<server-ip>`

2. **Firewall Configuration:**
   - Open port 80 (HTTP) or 443 (HTTPS)
   - Restrict to internal network only

3. **Optional: HTTPS Setup**
   - Use your organization's internal CA certificate
   - Configure in IIS or Nginx

---

## Supabase Configuration

### Current Setup
- **Project ID**: Configured in `/utils/supabase/info.tsx`
- **Backend URL**: `https://<projectId>.supabase.co/functions/v1/make-server-4343c471`
- **Database**: Using pre-configured KV store
- **Authentication**: Anonymous access (suitable for internal use)

### Important Notes
⚠️ **Data Security**: Supabase is configured for prototyping. For NHS production use:
- Review Supabase security settings
- Implement proper authentication if handling sensitive data
- Ensure compliance with NHS data governance policies
- Consider self-hosting Supabase on-premises

---

## Testing Your Deployment

1. **Access the site:**
   ```
   http://wis-hub.internal.nhs.wales
   ```

2. **Test functionality:**
   - ✅ Upload a document → should sync across all users
   - ✅ Create a community post → visible to all team members
   - ✅ Edit folder documentation → changes persist
   - ✅ Search functionality → finds all content

3. **Check backend:**
   ```
   http://wis-hub.internal.nhs.wales (your frontend)
   https://<projectId>.supabase.co/functions/v1/make-server-4343c471/health
   ```

---

## Maintenance & Monitoring

### Daily Operations
- **No database maintenance required** - Supabase handles it
- **No backup scripts needed** - Supabase provides automatic backups
- **Monitoring**: Check Supabase dashboard for API usage and errors

### Updating the Application
```bash
# Pull latest changes
git pull

# Rebuild
npm run build

# Copy to server (IIS example)
xcopy /E /Y dist\* C:\inetpub\wwwroot\wis-knowledge-hub\
```

---

## Troubleshooting

### Documents not loading?
- Check browser console for API errors
- Verify Supabase project is active
- Check `/utils/supabase/info.tsx` has correct credentials

### CORS errors?
- Backend already configured with open CORS
- If issues persist, check firewall isn't blocking requests

### Data not syncing?
- App polls every 3 seconds - data should appear quickly
- Check Network tab in browser dev tools
- Verify API endpoints are returning data

---

## Next Steps

1. **Test thoroughly** with your team
2. **Configure HTTPS** for secure access
3. **Set up user training** sessions
4. **Establish backup procedures** (export Supabase data periodically)

---

## Support

For technical assistance:
- Check browser console for errors
- Review Supabase function logs
- Test API endpoints directly

---

## Security Checklist

- [ ] Application accessible only on internal network
- [ ] Firewall rules configured correctly
- [ ] HTTPS enabled (recommended)
- [ ] Supabase project security reviewed
- [ ] User access training completed
- [ ] Backup/export procedure documented
- [ ] Data governance compliance verified

---

**Ready to deploy? Follow these steps to go live!**
