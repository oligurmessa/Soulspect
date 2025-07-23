'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getEmotionLogs, 
  getJournalEntries, 
  type EmotionLog, 
  type JournalEntry 
} from '@/lib/dbHelpers';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  BookOpen, 
  Activity,
  MessageSquare,
  Mic,
  Type,
  Video,
  FileText,
  BarChart3,
  PieChart,
  Check
} from 'lucide-react';

// Import shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Import shadcn charts
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  ComposedChart
} from 'recharts';



const Analytics = () => {
  const { user } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [emotionLogs, setEmotionLogs] = useState<EmotionLog[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Load data from database
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
        
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);


  // Process mood trend data from real database data
  const moodTrendData = useMemo(() => {
    const filteredLogs = emotionLogs
      .filter(log => selectedEmotion === 'all' || log.emotions.includes(selectedEmotion))
      .sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());

    // Group by day and calculate average mood
    const groupedByDay = filteredLogs.reduce((acc: { [key: string]: { moods: number[]; emotions: string[]; intensities: number[] } }, log) => {
      const dateKey = log.createdAt.toDate().toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { moods: [], emotions: [], intensities: [] };
      }
      acc[dateKey].moods.push(log.mood);
      acc[dateKey].emotions.push(...log.emotions);
      acc[dateKey].intensities.push(log.intensity || 5);
      return acc;
    }, {} as { [key: string]: { moods: number[]; emotions: string[]; intensities: number[] } });

    return Object.entries(groupedByDay).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: Number((data.moods.reduce((sum, mood) => sum + mood, 0) / data.moods.length).toFixed(1)),
      avgIntensity: Number((data.intensities.reduce((sum, int) => sum + int, 0) / data.intensities.length).toFixed(1)),
      entryCount: data.moods.length
    }));
  }, [emotionLogs, selectedEmotion]);

  // Process trigger data from real database data
  const triggerData = useMemo(() => {
    const allTriggers = emotionLogs.flatMap(log => log.triggers || []);
    const triggerCounts = allTriggers.reduce<Record<string, number>>((acc, trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(triggerCounts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count);
  }, [emotionLogs]);

  // Process trigger breakdown by mood from real database data
  const triggerMoodBreakdown = useMemo(() => {
    const breakdown: {
      [trigger: string]: { positive: number; neutral: number; negative: number; total: number }
    } = {};
    
    emotionLogs.forEach(log => {
      (log.triggers || []).forEach(trigger => {
        if (!breakdown[trigger]) {
          breakdown[trigger] = { positive: 0, neutral: 0, negative: 0, total: 0 };
        }
        breakdown[trigger].total++;
        
        if (log.mood >= 4) breakdown[trigger].positive++;
        else if (log.mood >= 2) breakdown[trigger].neutral++;
        else breakdown[trigger].negative++;
      });
    });

    return Object.entries(breakdown).map(([trigger, data]) => ({
      trigger,
      ...data,
      positivePercent: Math.round((data.positive / data.total) * 100),
      neutralPercent: Math.round((data.neutral / data.total) * 100),
      negativePercent: Math.round((data.negative / data.total) * 100)
    })).sort((a, b) => b.total - a.total);
  }, [emotionLogs]);

  // Process journal insights from real database data
  const journalInsights = useMemo(() => {
    const typeBreakdown = journalEntries.reduce((acc: Record<string, number>, entry) => {
      acc[entry.entryType] = (acc[entry.entryType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const textEntries = journalEntries.filter(entry => entry.entryType === 'text');
    const avgWordCount = textEntries.length > 0 
      ? Math.round(textEntries.reduce((sum, entry) => sum + (entry.content?.split(' ').length || 0), 0) / textEntries.length)
      : 0;

    const draftCount = journalEntries.filter(entry => entry.isDraft).length;
    const completedCount = journalEntries.filter(entry => !entry.isDraft).length;
    const completionRate = journalEntries.length > 0 ? Math.round((completedCount / journalEntries.length) * 100) : 0;

    return {
      typeBreakdown: Object.entries(typeBreakdown).map(([type, count]) => ({ type, count })),
      avgWordCount,
      draftCount,
      completedCount,
      completionRate,
      totalEntries: journalEntries.length
    };
  }, [journalEntries]);

  // Get unique emotions for filter from real data
  const uniqueEmotions = Array.from(new Set(emotionLogs.flatMap(log => log.emotions)));

  // Calculate summary stats from real data
  const currentMoodAvg = emotionLogs.slice(0, 7).length > 0 
    ? emotionLogs.slice(0, 7).reduce((sum, log) => sum + log.mood, 0) / Math.min(7, emotionLogs.length)
    : 0;
  const prevMoodAvg = emotionLogs.slice(7, 14).length > 0
    ? emotionLogs.slice(7, 14).reduce((sum, log) => sum + log.mood, 0) / Math.min(7, emotionLogs.slice(7, 14).length)
    : 0;
  const moodTrend = currentMoodAvg - prevMoodAvg;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // User not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your analytics.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Mood</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emotionLogs.length > 0 ? currentMoodAvg.toFixed(1) : 'N/A'}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {emotionLogs.length > 7 ? (
                  <>
                    {moodTrend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    {Math.abs(moodTrend).toFixed(1)} from last week
                  </>
                ) : (
                  'Need more data for trends'
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{journalInsights.totalEntries}</div>
              <div className="text-xs text-muted-foreground">
                {journalInsights.completionRate}% completion rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emotion Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emotionLogs.length}</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(emotionLogs.length / 30)} avg per day
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Trigger</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{triggerData[0]?.trigger || 'No data'}</div>
              <div className="text-xs text-muted-foreground">
                {triggerData[0]?.count ? `${triggerData[0].count} occurrences` : 'Start logging emotions'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="mood-trend" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mood-trend">📈 Mood & Emotion Trends</TabsTrigger>
            <TabsTrigger value="triggers">💡 Emotion Triggers</TabsTrigger>
            <TabsTrigger value="journal-insights">🧠 Journal Insights</TabsTrigger>
          </TabsList>

          {/* Mood & Emotion Trends */}
          <TabsContent value="mood-trend" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Mood Trend Over Time
                    </CardTitle>
                    <CardDescription>
                      Your emotional trajectory over the past 30 days
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Emotions</SelectItem>
                        {uniqueEmotions.map(emotion => (
                          <SelectItem key={emotion} value={emotion}>
                            {emotion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    mood: {
                      label: "Mood Score",
                      color: "hsl(var(--chart-1))",
                    },
                    avgIntensity: {
                      label: "Avg Intensity", 
                      color: "hsl(var(--chart-2))",
                    },
                    entryCount: {
                      label: "Daily Entries",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[400px]"
                >
                  <ComposedChart data={moodTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left" 
                      domain={[0, 10]} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Mood/Intensity', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Entries', angle: 90, position: 'insideRight' }}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent 
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(1) : value,
                          name
                        ]}
                      />} 
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="mood"
                      fill="var(--color-mood)"
                      fillOpacity={0.2}
                      stroke="var(--color-mood)"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgIntensity"
                      stroke="var(--color-avgIntensity)"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="entryCount"
                      fill="var(--color-entryCount)"
                      opacity={0.7}
                      radius={[2, 2, 0, 0]}
                    />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emotion Triggers */}
          <TabsContent value="triggers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Emotion Triggers
                  </CardTitle>
                  <CardDescription>
                    Most frequent triggers for your emotions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Trigger Count",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <RechartsBarChart data={triggerData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="trigger" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="var(--color-count)" 
                        radius={[4, 4, 0, 0]}
                        opacity={0.8}
                      />
                    </RechartsBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Trigger Mood Breakdown
                  </CardTitle>
                  <CardDescription>
                    How triggers affect your mood (positive/neutral/negative)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {triggerMoodBreakdown.slice(0, 6).map((item) => (
                      <div key={item.trigger} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.trigger}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.total} total
                          </span>
                        </div>
                        <div className="flex w-full rounded-full overflow-hidden h-2">
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${item.positivePercent}%` }}
                          />
                          <div 
                            className="bg-yellow-500" 
                            style={{ width: `${item.neutralPercent}%` }}
                          />
                          <div 
                            className="bg-red-500" 
                            style={{ width: `${item.negativePercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Positive: {item.positivePercent}%</span>
                          <span>Neutral: {item.neutralPercent}%</span>
                          <span>Negative: {item.negativePercent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Journal Insights */}
          <TabsContent value="journal-insights" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Entry Types Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of your journaling methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      ...journalInsights.typeBreakdown.reduce((acc, entry, index) => ({
                        ...acc,
                        [entry.type]: {
                          label: entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
                          color: `hsl(var(--chart-${(index % 5) + 1}))`,
                        },
                      }), {}),
                    }}
                    className="h-[300px]"
                  >
                    <RechartsPieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <Pie
                        data={journalInsights.typeBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count, percent }) => 
                          count > 0 ? `${type}: ${count} (${((percent ?? 0) * 100).toFixed(0)}%)` : ''
                        }
                        outerRadius={90}
                        innerRadius={40}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {journalInsights.typeBreakdown.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`var(--color-${entry.type})`}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value, name) => [
                            `${value} entries`,
                            name
                          ]}
                        />} 
                      />
                    </RechartsPieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Journal Statistics
                  </CardTitle>
                  <CardDescription>
                    Your journaling habits and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {journalInsights.completionRate}%
                      </span>
                    </div>
                    <Progress value={journalInsights.completionRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                      <div className="text-2xl font-bold">{journalInsights.completedCount}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Drafts</span>
                      </div>
                      <div className="text-2xl font-bold">{journalInsights.draftCount}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Avg Words (Text Entries)</span>
                    </div>
                    <div className="text-2xl font-bold">{journalInsights.avgWordCount}</div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Entry Types</h4>
                    {journalInsights.typeBreakdown.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.type === 'text' && <Type className="h-4 w-4" />}
                          {item.type === 'voice' && <Mic className="h-4 w-4" />}
                          {item.type === 'video' && <Video className="h-4 w-4" />}
                          <span className="capitalize">{item.type}</span>
                        </div>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;

