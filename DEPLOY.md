# Deployment Guide for Soulspect

## 🚀 Quick Deploy to Vercel

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your `oligurmessa/Soulspect` repository

### Step 2: Configure Environment Variables
In the Vercel dashboard, add these environment variables:

#### Firebase Configuration (Public)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your_app_id
```

#### Firebase Admin SDK (Private)
```
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PROJECT_ID=your_project_id
```

#### AI Integration
```
GEMINI_API_KEY=your_gemini_api_key
```

### Step 3: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-project.vercel.app`

---

## 🔧 Alternative: Manual Environment Setup

### Option 1: Copy from .env.local
If you have a working `.env.local` file:

1. Copy each value from your `.env.local`
2. Paste into Vercel environment variables
3. Make sure to wrap multi-line keys (like FIREBASE_ADMIN_PRIVATE_KEY) in quotes

### Option 2: Get Values from Firebase Console

#### Firebase Config:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → General
4. Scroll to "Your apps" section
5. Copy the config values

#### Firebase Admin SDK:
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Use values from that JSON file

#### Gemini API:
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Get your API key
3. Add to GEMINI_API_KEY

---

## 🌐 Other Deployment Options

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy --only hosting
```

### Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in site settings

### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Docker (Self-hosted)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Firebase project setup complete
- [ ] Gemini API key obtained
- [ ] Build succeeds locally (`npm run build`)
- [ ] All features tested
- [ ] Domain configured (optional)
- [ ] Analytics setup (optional)

---

## 🔍 Troubleshooting

### Build Errors
- Check environment variables are set correctly
- Ensure Firebase config matches your project
- Verify Gemini API key is valid

### Runtime Errors
- Check browser console for errors
- Verify Firebase security rules
- Test authentication flow

### Performance Issues
- Enable Vercel Analytics
- Check Lighthouse scores
- Monitor Firebase usage

---

## 📞 Support

If you encounter issues:
1. Check the build logs in Vercel dashboard
2. Verify all environment variables are set
3. Test locally first with `npm run dev`
4. Check Firebase and Gemini API quotas