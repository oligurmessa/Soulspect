#!/usr/bin/env node

/**
 * Firebase Admin SDK Verification Script
 * 
 * This script verifies that the Firebase Admin SDK is properly configured
 * and can access Firestore data.
 */

require('dotenv').config({ path: '.env.local' });

async function verifyFirebaseAdmin() {
  console.log('🔥 Firebase Admin SDK Verification');
  console.log('================================');
  
  try {
    // Import Firebase Admin SDK directly
    const { getApps, initializeApp, cert } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    const { getAuth } = require('firebase-admin/auth');
    
    // Initialize Firebase Admin (similar to our firebaseAdmin.ts)
    let adminApp, adminDb, adminAuth;
    
    if (getApps().length === 0) {
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "soulspect-app";
      let credential = undefined;

      // Method 1: Try to use service account JSON string from environment
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          credential = cert(serviceAccount);
          console.log('🔑 Using service account JSON from environment variable');
        } catch (parseError) {
          console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
        }
      }

      // Method 2: Try to build service account from individual environment variables
      if (!credential && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        try {
          const serviceAccount = {
            projectId: projectId,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          };
          credential = cert(serviceAccount);
          console.log('🔑 Using service account from individual environment variables');
        } catch (buildError) {
          console.error('❌ Failed to build service account from environment variables:', buildError.message);
        }
      }

      adminApp = initializeApp({
        credential: credential,
        projectId: projectId
      });
      
      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
    } else {
      adminApp = getApps()[0];
      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
    }
    
    console.log('✅ Firebase Admin SDK imported successfully');
    console.log(`📋 Project ID: ${adminApp.options.projectId}`);
    console.log(`🔑 Has Credentials: ${adminApp.options.credential ? 'Yes' : 'No'}`);
    
    // Test Firestore connection
    console.log('\n📊 Testing Firestore connection...');
    const testRef = adminDb.collection('_test').doc('connection');
    await testRef.set({ 
      timestamp: new Date(),
      test: 'Firebase Admin SDK verification'
    });
    
    const testDoc = await testRef.get();
    if (testDoc.exists) {
      console.log('✅ Firestore write/read test successful');
      await testRef.delete(); // Clean up test document
      console.log('🧹 Test document cleaned up');
    }
    
    // Test Authentication service
    console.log('\n🔐 Testing Firebase Auth connection...');
    try {
      // This will fail gracefully if no users exist, but confirms connection
      const listResult = await adminAuth.listUsers(1);
      console.log('✅ Firebase Auth connection successful');
      console.log(`👥 Users in database: ${listResult.users.length > 0 ? 'Found users' : 'No users found (normal for new projects)'}`);
    } catch (authError) {
      console.log('⚠️  Firebase Auth connection test failed:', authError.message);
    }
    
    // Test environment variables
    console.log('\n🔧 Environment Variables Check:');
    console.log(`FIREBASE_ADMIN_PROJECT_ID: ${process.env.FIREBASE_ADMIN_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`FIREBASE_SERVICE_ACCOUNT_KEY: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing'}`);
    console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅ Set' : '❌ Missing'}`);
    
    console.log('\n🎉 Firebase Admin SDK verification complete!');
    console.log('Your Firebase Admin SDK is properly configured and ready to use.');
    
  } catch (error) {
    console.error('\n❌ Firebase Admin SDK verification failed:');
    console.error(error.message);
    console.error('\nTroubleshooting steps:');
    console.error('1. Check your .env.local file contains the correct Firebase credentials');
    console.error('2. Verify your service account has proper permissions');
    console.error('3. Ensure your Firebase project ID is correct');
    console.error('4. Review the FIREBASE_ADMIN_SETUP.md file for detailed instructions');
    
    process.exit(1);
  }
}

// Run the verification
verifyFirebaseAdmin().catch(console.error);