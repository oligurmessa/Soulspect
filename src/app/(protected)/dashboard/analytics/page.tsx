// app/analytics/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEmotionLogs, getJournalEntries } from '@/lib/dbHelpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmotionLog, JournalEntry } from "@/lib/dbHelpers"
import { 
  AIInsight,
  generateAIInsight,
  processMoodTrendData,
  processTriggerData,
  processTriggerMoodBreakdown,
  processJournalInsights
} from '@/lib/analyticsUtils';
import SummaryCards from '@/components/SummaryCards';
import MoodTrendChart from '@/components/charts/MoodTrendChart';
import EmotionTriggersChart from '@/components/charts/EmotionTriggersChart';
import JournalInsightsChart from '@/components/charts/JournalInsightsChart';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [emotionLogs, setEmotionLogs] = useState<EmotionLog[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [, setAiInsight] = useState<AIInsight | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [emotions, journals] = await Promise.all([
          getEmotionLogs(user.uid, 100),
          getJournalEntries(user.uid, 100)
        ]);
        
        setEmotionLogs(emotions);
        setJournalEntries(journals);
        setAiInsight(generateAIInsight(emotions, journals));
        
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Processed data for charts and cards
  const moodTrendData = useMemo(() => processMoodTrendData(emotionLogs, selectedEmotion), [emotionLogs, selectedEmotion]);
  const triggerData = useMemo(() => processTriggerData(emotionLogs), [emotionLogs]);
  const triggerMoodBreakdown = useMemo(() => processTriggerMoodBreakdown(emotionLogs), [emotionLogs]);
  const journalInsights = useMemo(() => processJournalInsights(journalEntries), [journalEntries]);
  const uniqueEmotions = useMemo(() => Array.from(new Set(emotionLogs.flatMap(log => log.emotions))), [emotionLogs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to view your analytics.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* You can re-add the AI Insight Header here if needed */}
        
        <SummaryCards
          emotionLogs={emotionLogs}
          journalInsights={journalInsights}
          triggerData={triggerData}
        />

        <Tabs defaultValue="mood-trend" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="mood-trend"> Mood & Emotion Trends</TabsTrigger>
            <TabsTrigger value="triggers"> Emotion Triggers</TabsTrigger>
            <TabsTrigger value="journal-insights"> Journal Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="mood-trend">
            <MoodTrendChart 
              data={moodTrendData}
              uniqueEmotions={uniqueEmotions}
              selectedEmotion={selectedEmotion}
              onEmotionChange={setSelectedEmotion}
            />
          </TabsContent>

          <TabsContent value="triggers">
            <EmotionTriggersChart
              triggerData={triggerData}
              triggerMoodBreakdown={triggerMoodBreakdown}
            />
          </TabsContent>

          <TabsContent value="journal-insights">
            <JournalInsightsChart insights={journalInsights} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsPage;