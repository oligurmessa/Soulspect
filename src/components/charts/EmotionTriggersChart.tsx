'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart3, PieChart } from 'lucide-react';
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface TriggerData {
  trigger: string;
  count: number;
}

interface TriggerMoodBreakdown {
  trigger: string;
  positive: number;
  neutral: number; 
  negative: number;
  total: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
}

interface EmotionTriggersChartProps {
  triggerData: TriggerData[];
  triggerMoodBreakdown: TriggerMoodBreakdown[];
}

const EmotionTriggersChart: React.FC<EmotionTriggersChartProps> = ({
  triggerData,
  triggerMoodBreakdown
}) => {
  return (
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
  );
};

export default EmotionTriggersChart;