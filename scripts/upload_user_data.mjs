
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Use a relative path to the service account key file
const serviceAccountPath = path.resolve('./soulspect-app-firebase-adminsdk-fbsvc-acd56854a5.json');
let serviceAccount;
try {
  const fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(fileContents);
} catch (error) {
  console.error('Error reading or parsing service account file:', error);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const userDataPath = path.resolve('./user_data_focused.json');
const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

const { userId, journalEntries } = userData;

async function uploadJournalEntries() {
  if (!userId || !journalEntries) {
    console.error('Missing userId or journalEntries in the data file.');
    return;
  }

  const userJournalRef = db.collection('users').doc(userId).collection('journalEntries');

  for (const entry of journalEntries) {
    try {
      // Create a new document in the journalEntries subcollection
      const docRef = await userJournalRef.add(entry);
      console.log(`Successfully added journal entry with ID: ${docRef.id}`);
    } catch (error) {
      console.error('Error adding journal entry:', error);
    }
  }
}

uploadJournalEntries().catch(console.error);
