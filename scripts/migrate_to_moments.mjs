
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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

async function migrateToMoments() {
  if (!userId || !journalEntries) {
    console.error('Missing userId or journalEntries in the data file.');
    return;
  }

  const momentsRef = db.collection('moments');

  for (const entry of journalEntries) {
    const momentData = {
      userId: userId,
      type: 'journal',
      title: entry.title,
      content: entry.content,
      timestamp: Timestamp.fromDate(new Date(entry.date)),
      mood: entry.mood,
      emotions: entry.emotions,
      tags: entry.tags,
      createdAt: Timestamp.fromDate(new Date(entry.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(entry.updatedAt)),
    };

    try {
      const docRef = await momentsRef.add(momentData);
      console.log(`Successfully created moment with ID: ${docRef.id}`);
    } catch (error) {
      console.error('Error creating moment:', error);
    }
  }
}

migrateToMoments().catch(console.error);
