import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// For development, we'll use the client SDK approach on server-side
// This avoids the private key format issues
const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({ 
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "soulspect-app"
    });

export const adminDb = getFirestore(adminApp);
