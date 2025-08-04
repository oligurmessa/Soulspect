# Firebase Admin SDK Setup Guide

This guide will help you set up proper Firebase Admin SDK authentication to resolve the current credential errors.

## Current Error
```
Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
```

## Step-by-Step Setup

### 1. Generate Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`soulspect-app`)
3. Click the gear icon ⚙️ → **Project Settings**
4. Navigate to the **Service Accounts** tab
5. Scroll down to the **Firebase Admin SDK** section
6. Click **Generate new private key**
7. A JSON file will be downloaded (e.g., `soulspect-app-firebase-adminsdk-xxxxx.json`)

### 2. Configure Credentials (Choose ONE Method)

#### Method A: Service Account JSON String (Recommended for Production)

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Minify it (remove newlines and spaces) using a JSON minifier
4. Add to your `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"soulspect-app",...}'
```

#### Method B: Service Account JSON File (Recommended for Local Development)

1. Place the downloaded JSON file in your project root (outside the `src` folder)
2. Rename it to `firebase-service-account.json`
3. Add to your `.env.local`:

```bash
GOOGLE_APPLICATION_CREDENTIALS="./firebase-service-account.json"
```

#### Method C: Individual Environment Variables (Current Setup)

You're already using this method with individual keys in `.env.local`. This should work, but Method A or B are more reliable.

### 3. Verify Your Configuration

Add the following to your `.env.local` (you already have most of these):

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID="soulspect-app"

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID="soulspect-app"

# Choose ONE of the following credential methods:

# Option A: Full JSON (recommended)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"soulspect-app",...}'

# Option B: File path
GOOGLE_APPLICATION_CREDENTIALS="./firebase-service-account.json"

# Option C: Individual fields (your current setup)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxxxx@soulspect-app.iam.gserviceaccount.com"
```

### 4. Security Considerations

- **NEVER** commit service account files to Git
- The `.gitignore` has been updated to exclude service account files
- Use environment variables for production deployments
- Rotate service account keys regularly

### 5. Test the Setup

Run this command to test if the Admin SDK is working properly:

```bash
npm run dev
```

Check the console logs for:
```
[FIREBASE-ADMIN] Initialized successfully with project: soulspect-app
[FIREBASE-ADMIN] Credential method: Service Account
```

### 6. Troubleshooting

#### Error: "Could not load the default credentials"
- Make sure you've set one of the credential environment variables
- Verify the JSON format is valid (if using FIREBASE_SERVICE_ACCOUNT_KEY)
- Check that the service account file exists (if using GOOGLE_APPLICATION_CREDENTIALS)

#### Error: "Project does not exist or insufficient permissions"
- Verify the project ID matches your Firebase project
- Ensure the service account has the necessary roles:
  - Firebase Admin SDK Administrator Service Agent
  - Cloud Datastore User (for Firestore access)

#### Error: "Private key must be a string"
- Ensure newlines in the private key are properly escaped as `\\n`
- For JSON strings, make sure special characters are properly escaped

### 7. Production Deployment

For production environments (Vercel, Netlify, etc.):

1. Use the **Service Account JSON String** method (Method A)
2. Add the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable in your hosting platform
3. Never use file paths in production as files may not persist

### 8. Service Account Permissions

Ensure your service account has these IAM roles:
- **Firebase Admin** - For full Firebase access
- **Cloud Datastore User** - For Firestore operations
- **Firebase Authentication Admin** - For user management

You can verify/add these in the [Google Cloud Console](https://console.cloud.google.com/iam-admin/iam).

---

## Quick Fix for Current State

Since you already have individual credentials in `.env.local`, the updated Firebase Admin initialization should work immediately. The system will automatically use your existing `FIREBASE_ADMIN_PRIVATE_KEY` and `FIREBASE_ADMIN_CLIENT_EMAIL` variables.

Test by running:
```bash
npm run dev
```

And check the console for successful initialization messages.