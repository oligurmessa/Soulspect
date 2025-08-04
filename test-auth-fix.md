# Firestore Authentication Fix - Testing Guide

## Problem Summary
The AI system was failing with permission errors because server-side API routes were using client-side Firebase SDK without proper authentication context.

## Root Causes Fixed

1. **Server-side authentication**: API routes now properly authenticate requests using Firebase Admin SDK
2. **Security rules updated**: Added top-level collections (`moments`, `vectorMetadata`) for better server access
3. **Proper error handling**: Added fallback authentication and comprehensive error reporting
4. **Database helpers**: Created server-side helpers that use Firebase Admin SDK

## Testing Instructions

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Authentication Flow

#### Option A: Using Test Script (Automated)
```bash
node src/scripts/test-firestore-auth.js
```

#### Option B: Manual Testing (Frontend)

1. **Login to the app** at `http://localhost:3000/login`
   - Use user ID: `aWYBYUVk8dSW6qldAHlhIzEOyOv2`
   - Or any other authenticated user

2. **Test AI Indexing**
   - Go to browser console
   - Run: 
   ```javascript
   fetch('/api/test-auth', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ userId: 'aWYBYUVk8dSW6qldAHlhIzEOyOv2' })
   }).then(r => r.json()).then(console.log)
   ```

3. **Test AI Chat**
   - Go to Soulspace page (`/dashboard/soulspace`)
   - Try asking a question
   - Should work without permission errors

4. **Test Data Indexing**
   - Check browser console for indexing success messages
   - No more "7 PERMISSION_DENIED" errors

### 3. Verify Fixes

#### ✅ Expected Success Indicators:
- API routes return `200` status codes
- Authentication shows `{ success: true, auth: { uid: "...", email: "..." } }`
- Database queries work without permission errors
- AI responses are generated successfully
- Vector indexing completes without errors

#### ❌ Failure Indicators to Watch For:
- `401 Unauthorized` - Authentication not working
- `403 Forbidden` - User trying to access wrong data
- `7 PERMISSION_DENIED` - Security rules still blocking access
- `"No moments found, falling back to legacy data"` - Database access issues

## Key Changes Made

### 1. Security Rules (`firestore.rules`)
- Added top-level `moments` and `vectorMetadata` collections
- Maintained backward compatibility with subcollections
- Both collections use `request.auth.uid == resource.data.userId` pattern

### 2. Server Authentication (`firebaseServerAuth.ts`)
- Proper Firebase Admin SDK initialization
- Token verification from Authorization headers
- Fallback userId extraction for debugging
- Comprehensive error handling

### 3. Database Helpers (`dbHelpersServer.ts`)
- Server-side functions using Firebase Admin SDK
- Proper error handling and logging
- Support for both top-level and subcollection access

### 4. API Routes Updated
- All critical API routes now authenticate requests
- Proper authorization checks (user can only access own data)
- Enhanced error reporting

### 5. Client Library (`authApiClient.ts`)
- Helper functions for making authenticated API calls
- Automatic token attachment to requests
- Backward compatibility support

## Environment Variables Needed

For full functionality, add to `.env.local`:
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_ADMIN_PROJECT_ID=soulspect-app
```

If not available, the system works in "fallback mode" with limited server-side capabilities.

## Deployment Considerations

1. **Production**: Must have proper service account key
2. **Development**: Can work without service account (fallback mode)
3. **Security Rules**: Deploy updated rules with `firebase deploy --only firestore:rules`
4. **Indexes**: Existing indexes work with new structure (using collectionGroup)

## Monitoring

Watch for these log messages:
- `[SERVER] Getting emotion logs for user: ...` - Server helpers working
- `[API] Indexing user data for authenticated user: ...` - API authentication working
- `[FIREBASE-ADMIN] Initialized successfully with project: ...` - Admin SDK working
- `Found X relevant context items` - AI system accessing data successfully