import { NextRequest, NextResponse } from 'next/server';
import { getJournalEntriesServer, getEmotionLogsServer } from '@/lib/dbHelpersServer';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase/firestore';

// Helper to clean undefined values from object
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefined(value);
    }
  }
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log(`[MIGRATION] Starting simple migration for user: ${userId}`);

    // Get legacy data using working server helpers
    const [journalEntries, emotionLogs] = await Promise.all([
      getJournalEntriesServer(userId, 100),
      getEmotionLogsServer(userId, 100)
    ]);

    console.log(`[MIGRATION] Found ${journalEntries.length} journal entries, ${emotionLogs.length} emotion logs`);

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    // Convert journal entries to moments
    for (const entry of journalEntries) {
      try {
        const momentData = {
          userId,
          type: 'journal' as const,
          title: entry.title,
          content: entry.content || '',
          timestamp: entry.date?.toDate ? entry.date.toDate() : 
                    entry.createdAt?.toDate ? entry.createdAt.toDate() : 
                    Timestamp.now(),
          journalData: {
            entryType: entry.entryType || 'text',
            isDraft: entry.isDraft || false,
            wordCount: (entry.content || '').split(' ').length,
          },
          mood: entry.mood,
          emotions: entry.emotions,
          attachments: entry.attachments,
          tags: (entry as any).tags,
        };

        // Clean undefined values and use Firebase Admin SDK
        const cleanedData = cleanUndefined({
          ...momentData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        await adminDb.collection('moments').add(cleanedData);
        successful++;
        console.log(`[MIGRATION] ✅ Migrated journal entry: ${entry.id}`);
      } catch (error) {
        failed++;
        const errorMsg = `Journal entry ${entry.id}: ${error}`;
        errors.push(errorMsg);
        console.error(`[MIGRATION] ❌ ${errorMsg}`);
      }
    }

    // Convert emotion logs to moments
    for (const log of emotionLogs) {
      try {
        const emotionContent = `Mood: ${log.mood}/6
Emotions: ${log.emotions.join(', ')}
${log.triggers ? `Triggers: ${log.triggers.join(', ')}` : ''}
${log.context ? `Context: ${log.context}` : ''}`;

        const momentData = {
          userId,
          type: 'emotion' as const,
          content: emotionContent,
          timestamp: log.createdAt?.toDate ? log.createdAt.toDate() : Timestamp.now(),
          mood: log.mood,
          emotions: log.emotions,
          triggers: log.triggers,
          emotionData: {
            context: log.context,
            intensity: log.intensity,
          },
        };

        // Clean undefined values and use Firebase Admin SDK
        const cleanedData = cleanUndefined({
          ...momentData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        await adminDb.collection('moments').add(cleanedData);
        successful++;
        console.log(`[MIGRATION] ✅ Migrated emotion log: ${log.id}`);
      } catch (error) {
        failed++;
        const errorMsg = `Emotion log ${log.id}: ${error}`;
        errors.push(errorMsg);
        console.error(`[MIGRATION] ❌ ${errorMsg}`);
      }
    }

    console.log(`[MIGRATION] Complete: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      result: {
        successful,
        failed,
        errors,
        journalEntries: journalEntries.length,
        emotionLogs: emotionLogs.length,
      }
    });

  } catch (error) {
    console.error('[MIGRATION] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}