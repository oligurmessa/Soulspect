import { getApps, initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK with proper configuration
let adminApp: any;

try {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "soulspect-app";
    let credential = undefined;

    // Method 1: Try to use service account JSON string from environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        credential = cert(serviceAccount);
        console.log('[FIREBASE-ADMIN] Using service account JSON from environment variable');
      } catch (parseError) {
        console.error('[FIREBASE-ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
      }
    }

    // Method 2: Try to build service account from individual environment variables
    if (!credential && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      try {
        const serviceAccount: ServiceAccount = {
          projectId: projectId,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
        credential = cert(serviceAccount);
        console.log('[FIREBASE-ADMIN] Using service account from individual environment variables');
      } catch (buildError) {
        console.error('[FIREBASE-ADMIN] Failed to build service account from environment variables:', buildError);
      }
    }

    // Method 3: Try to load from service account file
    if (!credential) {
      try {
        // This will use the default Google Cloud credentials if available
        // (GOOGLE_APPLICATION_CREDENTIALS environment variable or gcloud default credentials)
        console.log('[FIREBASE-ADMIN] Attempting to use default Google Cloud credentials');
      } catch (defaultError) {
        console.error('[FIREBASE-ADMIN] No default credentials available:', defaultError);
      }
    }

    adminApp = initializeApp({
      credential: credential,
      projectId: projectId
    });
    
    console.log(`[FIREBASE-ADMIN] Initialized successfully with project: ${projectId}`);
    console.log(`[FIREBASE-ADMIN] Credential method: ${credential ? 'Service Account' : 'Default/None'}`);
  } else {
    adminApp = getApps()[0];
    console.log('[FIREBASE-ADMIN] Using existing app instance');
  }
} catch (error) {
  console.error('[FIREBASE-ADMIN] Initialization error:', error);
  
  // Fallback to basic initialization
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "soulspect-app";
    adminApp = getApps().length ? getApps()[0] : initializeApp({ projectId });
    console.log('[FIREBASE-ADMIN] Fallback initialization successful (limited functionality)');
  } catch (fallbackError) {
    console.error('[FIREBASE-ADMIN] Fallback initialization also failed:', fallbackError);
    throw new Error(`Firebase Admin SDK initialization failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
  }
}

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export { adminApp };
