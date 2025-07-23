'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart3 } from 'lucide-react';
import { 
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface MoodTrendData {
  date: string;
  mood: number;
  avgIntensity: number;
  entryCount: number;
}

interface MoodTrendChartProps {
  data: MoodTrendData[];
  uniqueEmotions: string[];
  selectedEmotion: string;
  onEmotionChange: (emotion: string) => void;
}

const MoodTrendChart: React.FC<MoodTrendChartProps> = ({
  data,
  uniqueEmotions,
  selectedEmotion,
  onEmotionChange
}) => {
  return (
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
            <Select value={selectedEmotion} onValueChange={onEmotionChange}>
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
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            <ChartLegend content={<ChartLegendContent payload={[]} />} />
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
  );
};

export default MoodTrendChart;