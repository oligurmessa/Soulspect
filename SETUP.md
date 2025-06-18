# 🚀 Complete Setup Guide for soulspect

This guide will walk you through setting up the soulspect application from start to finish.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18 or higher** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- A **Google account** for Firebase

## 🔥 Firebase Setup (Detailed)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `soulspect` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In your Firebase project, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   
   **Email/Password:**
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"
   
   **Google:**
   - Click on "Google"
   - Toggle "Enable" to ON
   - Select your project support email
   - Click "Save"

### Step 3: Get Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>`
5. Enter app nickname: `soulspect-web`
6. Click "Register app"
7. Copy the `firebaseConfig` object - you'll need these values

### Step 4: Configure Email Templates

1. Go to Authentication > Templates
2. Click the pencil icon next to "Password reset"
3. Click "Customize action URL"
4. Enter: `http://localhost:3000/auth/handle` (for development)
5. Click "Save"
6. Repeat for "Email verification" template

## 💻 Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository (replace with your actual repo URL)
git clone <your-repo-url>
cd soulspect

# Install dependencies
npm install
```

### Step 2: Environment Configuration

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and fill in your Firebase values:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key_here"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

### Step 3: Start Development Server

```bash
npm run dev
```

Your application will be available at [http://localhost:3000](http://localhost:3000)

## 🧪 Testing the Application

### Test Authentication Flow

1. **Landing Page**
   - Visit `http://localhost:3000`
   - Verify animations work smoothly
   - Click "Early Access" button

2. **Registration**
   - Try creating a new account
   - Check your email for verification link
   - Click the verification link

3. **Login**
   - Test email/password login
   - Try Google sign-in
   - Test "Forgot Password" flow

4. **Dashboard**
   - Verify protected route works
   - Test logout functionality

## 🚀 Production Deployment

### Deploying to Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set Environment Variables**
   - In Vercel dashboard, go to your project
   - Click "Settings" > "Environment Variables"
   - Add all your Firebase configuration variables

4. **Update Firebase Settings**
   - In Firebase Console, update email template URLs to your production domain
   - Add your production domain to authorized domains in Authentication settings

### Alternative: Deploy to Netlify

1. **Build the project**
```bash
npm run build
npm run export
```

2. **Deploy to Netlify**
   - Drag the `out` folder to Netlify deploy
   - Or connect your Git repository

3. **Configure Environment Variables**
   - In Netlify dashboard, go to Site settings > Environment variables
   - Add your Firebase configuration

## 🔧 Advanced Configuration

### Adding Custom Domain

1. **Purchase domain** (optional)
2. **Configure DNS** in your domain provider
3. **Update Firebase settings** with new domain
4. **Update email template URLs** in Firebase

### Setting up Analytics

1. **Google Analytics** (if enabled during Firebase setup)
2. **Vercel Analytics** (if using Vercel)
3. **Custom tracking** can be added to components

## 🐛 Common Issues and Solutions

### Issue: Firebase connection errors

**Solution:**
- Double-check all environment variables
- Ensure no trailing spaces in `.env.local`
- Verify Firebase project is active

### Issue: Email actions not working

**Solution:**
- Verify action URLs in Firebase templates
- Check that the correct domain is configured
- Ensure authentication is enabled

### Issue: Build errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Issue: Authentication state not persisting

**Solution:**
- Check browser console for errors
- Verify Firebase configuration
- Clear browser cache and cookies

## 📱 Mobile Testing

### Test on Mobile Devices

1. **Get your local IP address**
```bash
# On Mac/Linux
ifconfig | grep inet

# On Windows
ipconfig
```

2. **Access from mobile**
   - Visit `http://YOUR_IP_ADDRESS:3000`
   - Test touch interactions
   - Verify responsive design

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Environment variables are secure
- [ ] Firebase rules are properly configured
- [ ] HTTPS is enabled
- [ ] Email verification is required
- [ ] Password requirements are enforced
- [ ] Rate limiting is configured (Firebase handles this)

### Development Security

- [ ] Never commit `.env.local` to Git
- [ ] Use different Firebase projects for dev/prod
- [ ] Regular dependency updates

## 📊 Monitoring and Analytics

### Setting up Monitoring

1. **Firebase Analytics**
   - Automatically tracks user engagement
   - View in Firebase Console > Analytics

2. **Error Monitoring**
   - Consider adding Sentry for error tracking
   - Monitor console errors during development

3. **Performance Monitoring**
   - Use Next.js built-in analytics
   - Monitor Core Web Vitals

## 🎯 Next Steps

Once your basic setup is complete:

1. **Customize branding** - Update colors, fonts, and messaging
2. **Add features** - Implement emotion logging, AI insights
3. **Improve UX** - Add loading states, better error handling
4. **Testing** - Add unit tests and e2e tests
5. **SEO** - Optimize meta tags and sitemap
6. **Performance** - Optimize images and bundle size

## 📞 Getting Help

If you need assistance:

1. **Check the README.md** for basic information
2. **Review Firebase documentation** for authentication issues
3. **Check Next.js documentation** for framework questions
4. **Browser console** often shows helpful error messages
5. **GitHub Issues** for project-specific problems

---

Happy coding! 🎉