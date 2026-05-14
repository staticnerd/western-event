# Western Sydney Events — Vercel Deployment Guide

## 100% Free Stack
| Service | Purpose | Free Limit |
|---|---|---|
| **Vercel** | Hosting + serverless API | Unlimited deploys |
| **MongoDB Atlas** | Gallery database | 512 MB |
| **Cloudinary** | Photo & video storage + CDN | 25 GB storage, 25 GB bandwidth/month |

---

## Step 1 — Create Free Accounts (5 minutes)

### A) MongoDB Atlas
1. Go to https://www.mongodb.com/atlas/database
2. Click **Try Free** → create account
3. Choose **Free (M0)** cluster → select region closest to Australia (e.g. Sydney)
4. Under **Security → Database Access** → Add New User
   - Username: `wse_user`
   - Password: generate a strong one, **save it**
   - Role: **Atlas Admin**
5. Under **Security → Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
6. Under **Deployments → Database** → click **Connect** → **Drivers**
7. Copy the connection string — looks like:
   ```
   mongodb+srv://wse_user:YOUR_PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Add your database name: change `/?` to `/wse?`

### B) Cloudinary
1. Go to https://cloudinary.com → **Sign Up Free**
2. After signup, go to **Dashboard**
3. Copy these 3 values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### C) Generate Admin Password Hash
Run this in your terminal (Node.js must be installed):
```bash
node -e "console.log(require('bcryptjs').hashSync('YourChosenPassword', 12))"
```
Copy the output — it looks like `$2b$12$...`

---

## Step 2 — Deploy to Vercel (5 minutes)

### Option A — GitHub (recommended)
1. Push this project to a GitHub repo
2. Go to https://vercel.com → **New Project**
3. Import your GitHub repo
4. Click **Deploy** (Vercel auto-detects Next.js)

### Option B — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Step 3 — Add Environment Variables

In Vercel Dashboard → Your Project → **Settings → Environment Variables**

Add these one by one:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string (with `/wse?` database) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `ADMIN_USERNAME` | `admin` (or choose your own) |
| `ADMIN_PASSWORD_HASH` | The bcrypt hash you generated above |
| `SESSION_SECRET` | Any random string of 32+ characters |

After adding all variables → **Redeploy** the project.

---

## Step 4 — Test

- Public site: `https://your-project.vercel.app`
- Admin login: `https://your-project.vercel.app/admin/login`
- Login with your username and the password you hashed

---

## Step 5 — Custom Domain (optional)

In Vercel Dashboard → Your Project → **Settings → Domains**
- Add `westernsydneyevents.com.au`
- Follow the DNS instructions Vercel shows you
- Vercel provides free HTTPS automatically

---

## How to Upload Photos (after deployment)

1. Go to `/admin/login`
2. Log in with your credentials
3. Click **Upload Media**
4. Select category (e.g. Birthday Decor)
5. Drag & drop your photos or videos
6. Click **Upload to Website**
7. Photos appear on the website immediately ✅

---

## Changing Your Password

1. Log into admin panel
2. Go to **Settings**
3. Enter current and new password
4. Copy the generated hash
5. Paste it into Vercel Dashboard → Environment Variables → `ADMIN_PASSWORD_HASH`
6. Redeploy

---

## Security Features
- ✅ bcrypt password hashing (cost 12) — impossible to reverse
- ✅ iron-session encrypted cookie — session data never in browser
- ✅ Rate limiting — 10 login attempts per IP per 15 minutes
- ✅ httpOnly cookie — JavaScript cannot read session
- ✅ sameSite=strict — CSRF attacks blocked
- ✅ Helmet security headers on all responses
- ✅ File type validation before upload
- ✅ Cloudinary auto-strips EXIF data from images
- ✅ All admin API routes require valid server-side session

---

## Project Structure
```
wse-vercel/
├── pages/
│   ├── index.js              ← Public website
│   ├── _app.js
│   ├── admin/
│   │   ├── index.js          ← Admin panel (auth required)
│   │   └── login.js          ← Login page
│   └── api/
│       ├── gallery/
│       │   ├── index.js      ← Public: summary counts
│       │   └── [category].js ← Public: items per category
│       └── admin/
│           ├── login.js      ← POST: authenticate
│           ├── logout.js     ← POST: destroy session
│           ├── check.js      ← GET: verify session
│           ├── upload.js     ← POST: upload media
│           ├── media.js      ← GET/PATCH/DELETE: manage items
│           ├── bulk-delete.js← DELETE: bulk remove
│           └── change-password.js
├── lib/
│   ├── db.js                 ← MongoDB connection
│   ├── models.js             ← Media schema
│   ├── cloudinary.js         ← Upload/delete helpers
│   ├── session.js            ← iron-session config
│   └── ratelimit.js          ← Login rate limiting
├── styles/
│   └── globals.css
├── .env.example              ← Copy to .env.local for dev
├── next.config.js
└── package.json
```
