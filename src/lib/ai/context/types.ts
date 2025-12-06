export interface PersonalityContext {
    identity: {
        name?: string;
        pronouns?: string;
        roles?: string[]; // e.g., "student", "engineer"
    };
    coreThemes: string[]; // e.g., "perfectionism", "ambition"
    longTermGoals: string[]; // e.g., "build SoulSpect"
    emotionalBaseline: {
        typicalMood?: number; // 1-10
        dominantEmotions?: string[];
    };
    keyMilestones: {
        title: string;
        date?: string; // YYYY-MM-DD
    }[];
    lastUpdated: string; // ISO timestamp
}

export interface PertinentContextItem {
    id: string;
    timestamp: string;
    preview: string; // max ~120 chars
    score: number; // 0-1
}

export type PertinencyContext = PertinentContextItem[];

export interface ContextUpdateLog {
    userId: string;
    timestamp: string;
    changes: {
        coreThemesCount: number;
        longTermGoalsCount: number;
        keyMilestonesCount: number;
    };
}

export interface PertinencySelectionLog {
    userId: string;
    query: string;
    selectedIds: string[];
    scores: number[];
}
