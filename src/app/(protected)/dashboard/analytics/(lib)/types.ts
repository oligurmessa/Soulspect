// app/analytics/(components)/lib/types.ts
export interface EmotionLog {
  id: string;
  mood: number; // e.g., 1-10
  emotions: string[]; // e.g., ['Happy', 'Grateful']
  intensity?: number;
  triggers?: string[];
  createdAt: {
    toDate: () => Date;
  };
}

export interface JournalEntry {
  id: string;
  entryType: 'text' | 'voice' | 'video';
  content?: string;
  isDraft: boolean;
  createdAt: {
    toDate: () => Date;
  };
}

export interface AIInsight {
  summary: string;
  moodTrend: string;
  recommendation: string;
}