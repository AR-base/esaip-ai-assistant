# 🚀 Deploy ESAIP AI Assistant on Vercel

Vercel is simpler and more reliable than Cloudflare for this project. **Frontend and backend are on the same domain → no CORS issues at all.**

---

## 📦 What's in this folder

```
esaip/
├── index.html        ← HTML structure
├── css/
│   └── app.css       ← styles
├── js/
│   └── app.js        ← frontend logic
├── api/
│   └── chat.js       ← backend (proxies to Anthropic)
├── vercel.json       ← Vercel config
└── package.json      ← project descriptor
```

---

## 🚀 Deployment in 5 minutes

### Step 1 — Create a Vercel account

1. Go to **[vercel.com](https://vercel.com)**
2. Click **Sign Up** → use **Continue with GitHub** (easiest), or sign up with email
3. No credit card needed for the free tier

### Step 2 — Install Vercel CLI (the simplest way to deploy)

Open your terminal/command prompt:

**Windows (PowerShell):**
```powershell
npm install -g vercel
```

**Mac:**
```bash
sudo npm install -g vercel
```

**Don't have npm?** Install Node.js first from [nodejs.org](https://nodejs.org) (download the LTS version).

### Step 3 — Deploy

In your terminal:

```bash
cd path/to/esaip-vercel
vercel
```

You'll be asked a few questions:
- **Set up and deploy?** → `Y`
- **Which scope?** → press Enter (your personal account)
- **Link to existing project?** → `N`
- **What's your project's name?** → `esaip-ai-assistant`
- **In which directory is your code located?** → `.` (just press Enter)
- **Want to modify settings?** → `N`

After ~30 seconds you'll see:
```
✅ Production: https://esaip-ai-assistant.vercel.app
```

### Step 4 — Set environment variables

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)**
2. Click on your project: **esaip-ai-assistant**
3. Click **Settings** (top tabs) → **Environment Variables**
4. Add these three variables:

| Name | Value | Environment |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your `sk-ant-api03-...` key | Production, Preview, Development |
| `STUDENT_PASSWORD` | A long random secret for students | Production, Preview, Development |
| `FACULTY_PASSWORD` | A long random secret for faculty | Production, Preview, Development |
| `ALLOWED_ORIGIN` | Your deployed URL, e.g. `https://esaip-ai-assistant.vercel.app` (optional, only needed if you want cross-origin access from another domain) | Production, Preview, Development |

> **Choosing passwords**
> - Do **not** use a predictable word like `esaip2026` — anyone reading this README can guess it.
> - Generate a 20+ character random secret. Easy option:
>   ```bash
>   openssl rand -base64 24
>   ```
>   or on Windows PowerShell:
>   ```powershell
>   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
>   ```
> - Treat the passwords like an API key. Rotate them by updating the env vars and redeploying — any cached browser sessions will be forced to re-auth.

> **Note:** The password entered at login determines the role automatically — students get the student interface, faculty get the teaching tools interface.

5. Click **Save** for each one

### Step 5 — Redeploy to apply variables

In your terminal:
```bash
vercel --prod
```

Or just go to your Vercel dashboard → **Deployments** → click the latest one → **Redeploy**.

### Step 6 — Test it

1. Go to `https://esaip-ai-assistant.vercel.app` (your URL from step 3)
2. Enter the school password you generated in step 4
3. Send a test message
4. ✅ It should work!

---

## 🔍 Alternative: Deploy via GitHub (no CLI needed)

If you don't want to install npm/CLI:

1. Create a free **GitHub** account at [github.com](https://github.com)
2. Create a new repository called `esaip-ai-assistant`
3. Upload all files: `index.html`, `css/app.css`, `js/app.js`, `api/chat.js`, `package.json`, `vercel.json`
4. Go to [vercel.com/new](https://vercel.com/new)
5. Click **Import Git Repository** → select your repo
6. Click **Deploy**
7. Add environment variables (Step 4 above)
8. Done!

---

## ✅ Why Vercel is better than Cloudflare here

| | Cloudflare Workers | Vercel |
|---|---|---|
| CORS issues | ❌ Common | ✅ None (same domain) |
| Setup complexity | Medium | Easy |
| Free tier | 100k req/day | 100GB bandwidth |
| Custom domain | Paid | Free |
| Logs | Basic | Excellent |
| Deploy via Git | Yes | Yes (better UX) |

---

## 💰 Costs

- **Vercel Hobby (free)**: more than enough for ESAIP — 100GB bandwidth, unlimited deployments
- **Anthropic API (Haiku 4.5)**: ~$5 covers thousands of conversations
- **Set spending limit** at [console.anthropic.com](https://console.anthropic.com) → Settings → Limits

---

## 🆘 Troubleshooting

| Issue | Fix |
|---|---|
| "Invalid password" | `STUDENT_PASSWORD` or `FACULTY_PASSWORD` env var doesn't match what you typed |
| "Trop de tentatives" | The auth rate limit (10 wrong attempts / hour / IP) is protecting your account — wait the hour out or redeploy to reset |
| Build fails | Make sure `api/chat.js` exists with that exact path |
| "command not found: vercel" | Install: `npm install -g vercel` |
| Still see errors | Check Vercel dashboard → your project → Logs tab |

---

## 🎤 What to say in your presentation

> "L'assistant est déployé sur Vercel avec une fonction serverless qui sécurise la clé API et un mot de passe partagé pour l'accès. Frontend et backend partagent le même domaine, ce qui élimine tous les problèmes de CORS. Coût mensuel estimé : 10-20€ pour l'API Claude. Architecture prête pour la production avec rate limiting intégré."

---

Need help on any step? Just ask!
