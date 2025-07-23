// app/analytics/(components)/lib/analyticsUtils.ts
import { EmotionLog, JournalEntry } from '@/lib/dbHelpers';

export interface AIInsight {
  summary: string;
  moodTrend: string;
  recommendation: string;
}

// AI Insight Generation
export const generateAIInsight = (emotions: EmotionLog[], journals: JournalEntry[]): AIInsight => {
  const avgMood = emotions.length > 0 ? emotions.reduce((sum, log) => sum + log.mood, 0) / emotions.length : 0;
  const recentMoods = emotions.slice(0, 7).map(log => log.mood);
  const olderMoods = emotions.slice(7, 14).map(log => log.mood);
  const recentAvg = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : 0;
  const olderAvg = olderMoods.length > 0 ? olderMoods.reduce((a, b) => a + b, 0) / olderMoods.length : 0;
  const trendDirection = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';
  
  const topEmotions = emotions.flatMap(log => log.emotions).reduce((acc, emotion) => {
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonEmotion = Object.entries(topEmotions).sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';
  
  return {
    summary: `Your average mood is ${avgMood.toFixed(1)}/10 with "${mostCommonEmotion}" being your most frequent emotion.`,
    moodTrend: `Your mood trend is ${trendDirection} (${recentAvg.toFixed(1)} vs ${olderAvg.toFixed(1)} previous week).`,
    recommendation: avgMood >= 6 ? "Keep up the positive momentum!" : "Focus on activities that boost your mood."
  };
};

// Mood Trend Data Processing
export const processMoodTrendData = (emotionLogs: EmotionLog[], selectedEmotion: string) => {
  const filteredLogs = emotionLogs
    .filter(log => selectedEmotion === 'all' || log.emotions.includes(selectedEmotion))
    .sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());

  const groupedByDay = filteredLogs.reduce((acc: { [key: string]: { moods: number[]; intensities: number[] } }, log) => {
    const dateKey = log.createdAt.toDate().toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = { moods: [], intensities: [] };
    acc[dateKey].moods.push(log.mood);
    acc[dateKey].intensities.push(log.intensity || 5);
    return acc;
  }, {});

  return Object.entries(groupedByDay).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: Number((data.moods.reduce((s, m) => s + m, 0) / data.moods.length).toFixed(1)),
    avgIntensity: Number((data.intensities.reduce((s, i) => s + i, 0) / data.intensities.length).toFixed(1)),
    entryCount: data.moods.length
  }));
};

// Trigger Data Processing
export const processTriggerData = (emotionLogs: EmotionLog[]) => {
  const triggerCounts = (emotionLogs.flatMap(log => log.triggers || [])).reduce<Record<string, number>>((acc, trigger) => {
    acc[trigger] = (acc[trigger] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(triggerCounts).map(([trigger, count]) => ({ trigger, count })).sort((a, b) => b.count - a.count);
};

// Trigger Mood Breakdown Processing
export const processTriggerMoodBreakdown = (emotionLogs: EmotionLog[]) => {
    const breakdown: { [trigger: string]: { positive: number; neutral: number; negative: number; total: number } } = {};
    
    emotionLogs.forEach(log => {
      (log.triggers || []).forEach(trigger => {
        if (!breakdown[trigger]) breakdown[trigger] = { positive: 0, neutral: 0, negative: 0, total: 0 };
        breakdown[trigger].total++;
        if (log.mood >= 7) breakdown[trigger].positive++;
        else if (log.mood >= 4) breakdown[trigger].neutral++;
        else breakdown[trigger].negative++;
      });
    });

    return Object.entries(breakdown).map(([trigger, data]) => ({
      trigger, ...data,
      positivePercent: Math.round((data.positive / data.total) * 100),
      neutralPercent: Math.round((data.neutral / data.total) * 100),
      negativePercent: Math.round((data.negative / data.total) * 100)
    })).sort((a, b) => b.total - a.total);
};

// Journal Insights Processing
export const processJournalInsights = (journalEntries: JournalEntry[]) => {
    const typeBreakdown = journalEntries.reduce((acc: Record<string, number>, entry) => {
      acc[entry.entryType] = (acc[entry.entryType] || 0) + 1;
      return acc;
    }, {});
    const textEntries = journalEntries.filter(e => e.entryType === 'text');
    const avgWordCount = textEntries.length > 0 ? Math.round(textEntries.reduce((sum, entry) => sum + (entry.content?.split(' ').length || 0), 0) / textEntries.length) : 0;
    const completedCount = journalEntries.filter(entry => !entry.isDraft).length;
    const completionRate = journalEntries.length > 0 ? Math.round((completedCount / journalEntries.length) * 100) : 0;

    return {
      typeBreakdown: Object.entries(typeBreakdown).map(([type, count]) => ({ type, count })),
      avgWordCount,
      draftCount: journalEntries.length - completedCount,
      completedCount,
      completionRate,
      totalEntries: journalEntries.length
    };
};