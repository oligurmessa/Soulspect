import { Timestamp } from 'firebase/firestore';

export interface Moment {
    id?: string;
    userId: string;
    type: 'journal' | 'emotion' | 'voice' | 'photo' | 'video' | 'chat';
    title?: string;
    content: string;
    timestamp: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Emotional context (applicable to all types)
    mood?: number;           // 0-6 scale
    emotions?: string[];     // Selected emotions
    triggers?: string[];     // What caused this moment
    intensity?: number;      // 1-10 emotional intensity

    // Metadata
    tags?: string[];
    lastIndexedContentHash?: string | null; // Optimization: Hash of content when last indexed
    location?: string;
    weather?: string;

    // Media attachments
    attachments?: string[];  // File URLs

    // Type-specific data
    journalData?: {
        entryType: 'text' | 'voice' | 'video';
        prompt?: string;
        isDraft: boolean;
        wordCount?: number;
    };

    emotionData?: {
        context?: string;
        previousMood?: number;
        moodChange?: number;
    };

    voiceData?: {
        transcript: string;
        duration: number;        // seconds
        audioUrl?: string;
        language?: string;
        confidence?: number;
    };

    photoData?: {
        caption: string;
        name: string;
        imageUrl: string;
        aiDescription?: string;
        faces?: number;
        objects?: string[];
    };

    videoData?: {
        caption?: string;
        duration: number;        // seconds
        videoUrl: string;
        thumbnail?: string;
        transcript?: string;
    };

    chatData?: {
        userMessage: string;
        aiResponse: string;
        mode?: 'explore' | 'release' | 'decide' | 'normal';
        model?: string;
        context?: any[];
        insights?: string[];
    };
}

export interface Attachment {
    id?: string;
    userId: string;
    momentId: string;
    type: 'image' | 'audio' | 'video' | 'document';
    filename: string;
    url: string;
    size: number;            // bytes
    mimeType: string;
    uploadedAt: Timestamp;

    // Media-specific metadata
    imageData?: {
        width: number;
        height: number;
        caption?: string;
        aiDescription?: string;
    };

    audioData?: {
        duration: number;        // seconds
        transcript?: string;
        language?: string;
    };

    videoData?: {
        duration: number;        // seconds
        width: number;
        height: number;
        thumbnail?: string;
        transcript?: string;
    };
}

export interface AIInsight {
    id?: string;
    userId: string;
    type: 'pattern' | 'trend' | 'suggestion' | 'milestone';
    title: string;
    description: string;
    confidence: number;      // 0-1 confidence score
    createdAt: Timestamp;

    // Pattern-specific data
    patternData?: {
        frequency: number;
        triggers: string[];
        emotions: string[];
        timeOfDay?: string;
        dayOfWeek?: string;
        season?: string;
    };

    // Trend-specific data
    trendData?: {
        direction: 'improving' | 'declining' | 'stable';
        metric: string;
        timeframe: number;       // days
        significance: number;    // 0-1
    };

    // Related moments
    relatedMoments: string[];  // Moment IDs

    // Actionable suggestions
    suggestions?: string[];
}

export interface VectorMetadata {
    id?: string;
    userId: string;
    momentId: string;
    vectorId: string;        // ID in Pinecone
    indexed: boolean;
    indexedAt?: Timestamp;
    lastUpdated: Timestamp;

    // Vector properties
    dimensions: number;
    model: string;           // embedding model used

    // Search optimization
    contentPreview: string;  // First 200 chars
    searchableText: string;  // Processed text for search

    // Metadata for filtering
    momentType: Moment['type'];
    emotionContext?: {
        mood?: number;
        emotions?: string[];
        triggers?: string[];
    };

    timeContext: {
        timestamp: Timestamp;
        dayOfWeek: number;     // 0-6
        hourOfDay: number;     // 0-23
        season: string;        // spring, summer, fall, winter
    };
}

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    preferences: {
        timezone?: string;
        notifications?: boolean;
        theme?: 'light' | 'dark' | 'system';
        language?: string;
        startWeekOn?: boolean;
        autoTimezone?: boolean;
        emailNotifications?: boolean;
        soundEnabled?: boolean;
        volume?: number;
        fontSize?: string;
        reducedMotion?: boolean;
        highContrast?: boolean;
        twoFactor?: boolean;
        dataCollection?: boolean;
        autoBackup?: boolean;
        timeFormat24?: boolean;
        compactMode?: boolean;
        autoSave?: boolean;
        spellCheck?: boolean;
        appPassword?: string;
        lockFeatureEnabled?: boolean;
    };
}

export interface EmotionLog {
    id?: string;
    userId: string;
    mood: number;            // 0-6 (matching EmotionVisualizer scale)
    emotions: string[];      // Selected emotions from EmotionSelector
    triggers?: string[];     // Triggers like "Work", "Family", etc.
    context?: string;        // Additional context/notes
    intensity?: number;      // 1-10 intensity scale
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface JournalEntry {
    id?: string;
    userId: string;
    title: string;
    content: string;
    entryType: 'text' | 'voice' | 'video';  // Based on the three tabs
    prompt?: string;
    mood?: number;
    emotions?: string[];
    attachments?: string[];  // File URLs
    isDraft: boolean;
    date: Timestamp;         // Entry date (can be different from created)
    createdAt: Timestamp;
    updatedAt: Timestamp;
    carouselContent?: {
        photos: {
            id: string | number;
            name: string;
            caption: string;
            url: string;
            createdAt: string;
        }[];
        emotions: {
            id: string | number;
            emotion: string;
            intensity: number;
            note: string;
            emotions: string[];
            triggers: string[];
            createdAt: string;
        }[];
        audioRecordings: {
            id: string | number;
            transcript: string;
            duration: number;
            createdAt: string;
            audioUrl?: string;
        }[];
    };
}

export interface UserValues {
    id?: string;
    userId: string;
    values: {
        name: string;
        description?: string;
        importance: number;     // 1-10
        alignment: number;      // 1-10 how well they're living it
    }[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface SoulspaceItem {
    id?: string;
    userId: string;
    type: 'note' | 'image' | 'audio' | 'video' | 'link';
    title: string;
    content: string;
    url?: string;           // For attachments
    tags?: string[];
    isPrivate: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface AnalyticsData {
    id?: string;
    userId: string;
    period: 'daily' | 'weekly' | 'monthly';
    date: Timestamp;
    emotionStats: {
        averageMood: number;
        emotionCounts: Record<string, number>;
        triggerCounts: Record<string, number>;
    };
    journalStats: {
        entriesCount: number;
        wordsWritten: number;
        voiceMinutes: number;
        videoMinutes: number;
    };
    createdAt: Timestamp;
}
