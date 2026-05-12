# 🚀 Samura Xiter — Full Deployment Guide

## ⚠️ Before Anything Else — Security Check

Your `.env` file contains real credentials. Make sure `.gitignore` is present
(it is — already included in this project). **NEVER delete `.gitignore`.**

Verify before every `git add .`:
```bash
git status   # .env should NOT appear in the list
```

---

## Step 1: Set Up Firebase Project

1. Go to https://console.firebase.google.com → New Project
2. Enable **Authentication** → Email/Password + Google
3. Enable **Firestore Database** → Start in production mode
4. Go to Project Settings → copy your config values into `.env`

### Create your Admin account in Firestore:
After you sign up once in the app, go to Firestore → `users` collection →
find your user document → add a field: `role: "admin"` (string).
This gives you access to `/admin`.

---

## Step 2: Deploy Firestore Security Rules

In Firebase Console → Firestore → Rules tab, paste the contents of
`firestore.rules` and click **Publish**.

---

## Step 3: Create Required Firestore Index

The downloads page needs a composite index.

Firebase Console → Firestore → Indexes → Add Index:

| Collection  | Field 1               | Field 2                  |
|-------------|-----------------------|--------------------------|
| `downloads` | `isPremium` Ascending | `updatedAt` Descending   |
| `orders`    | `uid` Ascending       | `createdAt` Descending   |
| `announcements` | `createdAt` Descending | —                   |

*(Or just open the app after deploy — Firebase prints a direct link in the browser console)*

---

## Step 4: Authorize Vercel Domain in Firebase

Firebase Console → Authentication → Settings → Authorized domains:
- Add `your-app.vercel.app`
- Add your custom domain if you have one

**Without this, Google Sign-In will fail in production.**

---

## Step 5: Push to GitHub

```bash
cd samura-xiter          # your project folder
git init
git add .
git commit -m "feat: initial Samura Xiter launch"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 6: Deploy on Vercel

1. Go to https://vercel.com → New Project → Import your GitHub repo
2. Framework: **Vite** (auto-detected)
3. Go to **Settings → Environment Variables** and add ALL values from `.env`:

| Variable | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase → Project Settings → Your apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | same |
| `VITE_FIREBASE_PROJECT_ID` | same |
| `VITE_FIREBASE_STORAGE_BUCKET` | same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same |
| `VITE_FIREBASE_APP_ID` | same |
| `VITE_EMAILJS_SERVICE_ID` | emailjs.com dashboard |
| `VITE_EMAILJS_TEMPLATE_ID` | emailjs.com dashboard |
| `VITE_EMAILJS_PUBLIC_KEY` | emailjs.com dashboard |
| `VITE_WHATSAPP_NUMBER` | Your number e.g. `94763XXXXXX` |
| `VITE_BANK_NAME` | Your bank |
| `VITE_BANK_ACCOUNT` | Your account number |
| `VITE_BANK_HOLDER` | Account holder name |
| `VITE_EZCASH_NUMBER` | Your EzCash number |

4. Click **Deploy**. Done ✅

---

## Admin Panel Access

URL: `https://your-app.vercel.app/admin`

What you can do from the Admin Panel:

| Tab | Actions |
|---|---|
| **Overview** | Live stats: users, orders, downloads, premium count |
| **Orders** | View all orders, confirm/reject payments, delete |
| **Packages** | Add / edit / delete pricing packages |
| **Downloads** | Add / edit / delete free & premium download files |
| **Users** | Change plan, set license expiry, adjust device slots |
| **Announcements** | Create / edit / delete site-wide banners |
| **Pages** | Edit homepage text, about page content, contact info |

---

## Local Development

```bash
cp .env.example .env   # then fill in your real values
npm install
npm run dev            # runs at http://localhost:3000
```
