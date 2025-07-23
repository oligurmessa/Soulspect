// app/analytics/(components)/SummaryCards.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, BookOpen, Activity, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { EmotionLog } from '@/lib/dbHelpers';

interface SummaryCardsProps {
  emotionLogs: EmotionLog[];
  journalInsights: any;
  triggerData: { trigger: string; count: number }[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ emotionLogs, journalInsights, triggerData }) => {
  const currentMoodAvg = emotionLogs.length > 0
    ? emotionLogs.slice(0, 7).reduce((sum, log) => sum + log.mood, 0) / Math.min(7, emotionLogs.length)
    : 0;
  const prevMoodAvg = emotionLogs.length > 7
    ? emotionLogs.slice(7, 14).reduce((sum, log) => sum + log.mood, 0) / Math.min(7, emotionLogs.slice(7, 14).length)
    : 0;
  const moodTrend = currentMoodAvg - prevMoodAvg;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Mood</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{emotionLogs.length > 0 ? currentMoodAvg.toFixed(1) : 'N/A'}</div>
          <p className="flex items-center text-xs text-muted-foreground">
            {emotionLogs.length > 7 ? (
              <>
                {moodTrend >= 0 ? <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                {Math.abs(moodTrend).toFixed(1)} from last week
              </>
            ) : 'More data needed'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{journalInsights.totalEntries}</div>
          <p className="text-xs text-muted-foreground">{journalInsights.completionRate}% completion rate</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Emotion Logs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{emotionLogs.length}</div>
          <p className="text-xs text-muted-foreground">{Math.round(emotionLogs.length / 30)} avg per day</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Trigger</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">{triggerData[0]?.trigger || 'N/A'}</div>
          <p className="text-xs text-muted-foreground">{triggerData[0]?.count ? `${triggerData[0].count} occurrences` : 'Log emotions to see'}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;