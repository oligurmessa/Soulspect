// app/analytics/(components)/charts/JournalInsightsChart.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, MessageSquare, Check, Type, Mic, Video } from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Label
} from 'recharts';

interface JournalInsightsChartProps {
  insights: any;
}

const triggerColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

const JournalInsightsChart: React.FC<JournalInsightsChartProps> = ({ insights }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Entry Types Distribution
          </CardTitle>
          <CardDescription>Breakdown of your journaling methods</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={insights.typeBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="type"
              >
                {insights.typeBreakdown.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={triggerColors[index % triggerColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Journal Statistics
          </CardTitle>
          <CardDescription>Your journaling habits and engagement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm text-muted-foreground">{insights.completionRate}%</span>
            </div>
            <Progress value={insights.completionRate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                <span>Completed</span>
              </div>
              <div className="text-2xl font-bold">{insights.completedCount}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-orange-500" />
                <span>Drafts</span>
              </div>
              <div className="text-2xl font-bold">{insights.draftCount}</div>
            </div>
          </div>

          <div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Type className="h-4 w-4 text-blue-500" />
                <span>Avg Words (Text Entries)</span>
              </div>
              <div className="text-2xl font-bold">{insights.avgWordCount}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalInsightsChart;