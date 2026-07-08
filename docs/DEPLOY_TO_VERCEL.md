# Deploying to Vercel vs GoDaddy

## Quick Comparison

| Feature | Vercel | GoDaddy |
|---------|--------|---------|
| **Setup Time** | 5 minutes | 30+ minutes |
| **Cost** | Free (with paid options) | ~$10-20/month |
| **Auto-Deploy** | Yes (on GitHub push) | Manual (FTP upload) |
| **SSL Certificate** | Automatic & Free | Included |
| **Performance** | Global CDN | Shared hosting |
| **Best For** | Modern web apps, static sites | Traditional websites |

## Why Vercel?
✓ **Automatic deployments** — push to GitHub, site updates instantly
✓ **Free tier** — no credit card required to start
✓ **Global CDN** — your site loads fast everywhere
✓ **Zero configuration** — detects static site automatically
✓ **Preview URLs** — test pull requests before merging

---

# Deploy to Vercel — Simple Step-by-Step Guide

## Step 1: Sign Up (2 minutes)

1. Go to https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. You're in! No email verification needed.

## Step 2: Create a New Project (1 minute)

1. Click **"Add New Project"** on the dashboard
2. Select your GitHub account (top-right dropdown)
3. Find **"jarvis-portfolio"** in the list
4. Click **"Import"**

## Step 3: Configure (30 seconds)

The configuration page appears with these fields:

- **Project Name**: `jarvis-portfolio` (auto-filled, keep it)
- **Framework Preset**: Select **"Other"** (it's a static HTML site)
- **Root Directory**: Leave blank (or select `.`)

Click **"Deploy"** at the bottom.

**That's it!** Vercel is building your site...

## Step 4: Wait for Deployment (2–3 minutes)

You'll see a progress screen with these steps:
1. Building your project
2. Uploading files
3. Finalizing...

When it's done, you'll see a checkmark ✓ and a **URL** like:
```
https://jarvis-portfolio-[random].vercel.app
```

Click it to see your live site!

## Step 5: Set a Custom Domain (Optional, 5 minutes)

Want your own domain (e.g., `www.hana-x.ai/personal-brand`)?

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `www.hana-x.ai`
4. Vercel shows DNS instructions — add them to your GoDaddy DNS settings
5. Wait 5–15 minutes for DNS to update

---

# How Auto-Deploy Works

After deployment, every time you:
1. **Push to GitHub** on the `main` branch
2. Vercel automatically rebuilds and deploys your site
3. Your live URL updates instantly

No manual FTP upload needed!

---

# Quick Reference: Common Tasks

## Preview a Pull Request
When you open a pull request on GitHub, Vercel automatically creates a **preview URL** (e.g., `https://jarvis-portfolio-pr-42.vercel.app`).
- Share this link to let others review changes
- Original live site stays unchanged

## Roll Back to Previous Deploy
1. Go to **Deployments** tab
2. Click on an older deployment
3. Click **"Promote to Production"**
Done!

## View Build Logs
If deployment fails:
1. Go to **Deployments** → failed deploy
2. Click **"View Function Logs"**
3. See what went wrong

---

# Vercel vs GoDaddy: When to Use Each

### Use **Vercel** if:
- You want automatic deployments on every GitHub push
- You prefer a modern, developer-friendly workflow
- You like preview URLs for pull requests
- You want fast global performance
- You don't want to manage FTP credentials

### Use **GoDaddy** if:
- You need a traditional shared hosting setup
- You want a single annual bill (all-in-one)
- You need email hosting bundled with the domain
- You prefer manual control over every update

---

# Next Steps

1. **Deploy now**: Follow steps 1–4 above
2. **Test the site**: Open your Vercel URL
3. **Make a change**: Edit a file on GitHub, watch it auto-deploy
4. **Set custom domain**: (Optional) Add your domain in step 5

---

# Troubleshooting

### "Build failed" error?
Check the build logs:
1. Click on the failed deployment
2. Look for error messages in **Function Logs**
3. Common fix: Ensure all CSS/JS files are in the right folders

### Site shows old version?
Browser cache! Do a hard refresh:
- **Windows**: `Ctrl + Shift + Delete` (open cache settings)
- **Mac**: `Cmd + Shift + Delete` (in Chrome)

### Custom domain not working?
DNS takes 5–15 minutes. Check:
1. Did you add the DNS records to GoDaddy?
2. Did you wait 10+ minutes?
3. Go to **Domains** in Vercel and verify the status shows "Valid Configuration"

---

# Questions?

- **Vercel Docs**: https://vercel.com/docs
- **Contact Support**: vercel.com/support

**Happy deploying!** 🚀
