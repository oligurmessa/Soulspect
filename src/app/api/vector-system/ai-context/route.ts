import { NextRequest, NextResponse } from 'next/server';
import VectorEngine from '@/lib/vectorEngine';
import { getMoments } from '@/lib/moments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, limit = 5 } = body;

    if (!userId || !query) {
      return NextResponse.json(
        { success: false, error: 'userId and query are required' },
        { status: 400 }
      );
    }

    let contexts: any[] = [];
    let patterns: string[] = [];
    let emotionalTrends: any = null;

    try {
      // Get relevant contexts using vector search
      const searchResults = await VectorEngine.searchMoments(userId, query, { topK: limit });
      
      contexts = searchResults.map(result => ({
        momentId: result.momentId,
        score: result.score,
        preview: result.preview,
        type: result.metadata.momentType,
        mood: result.metadata.mood || null,
        emotions: result.metadata.emotions || [],
        timestamp: result.metadata.timestamp,
      }));

      // Analyze patterns from the results
      if (contexts.length > 0) {
        // Extract common emotions
        const allEmotions = contexts.flatMap(c => c.emotions || []);
        const emotionCounts = allEmotions.reduce((acc: any, emotion) => {
          acc[emotion] = (acc[emotion] || 0) + 1;
          return acc;
        }, {});
        
        const topEmotions = Object.entries(emotionCounts)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([emotion]) => emotion);

        if (topEmotions.length > 0) {
          patterns.push(`Common emotions: ${topEmotions.join(', ')}`);
        }

        // Analyze mood trends - only if we have valid mood data
        const validMoods = contexts.filter(c => c.mood !== null && c.mood !== undefined && c.mood > 0).map(c => c.mood);
        if (validMoods.length >= 3) { // Need at least 3 data points for meaningful trends
          const avgMood = validMoods.reduce((sum, mood) => sum + mood, 0) / validMoods.length;
          emotionalTrends = {
            averageMood: avgMood,
            moodCount: validMoods.length,
            trend: avgMood > 4 ? 'positive' : avgMood < 3 ? 'concerning' : 'neutral',
            hasValidData: true,
          };
          
          patterns.push(`Average mood: ${avgMood.toFixed(1)}/6 (${emotionalTrends.trend}) based on ${validMoods.length} entries`);
        } else if (validMoods.length > 0) {
          patterns.push(`Limited mood data: ${validMoods.length} entries available`);
        }

        // Time-based patterns
        const timestamps = contexts.map(c => new Date(c.timestamp));
        const hours = timestamps.map(t => t.getHours());
        const hourCounts = hours.reduce((acc: any, hour) => {
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {});
        
        const peakHour = Object.entries(hourCounts)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0];
        
        if (peakHour && (peakHour[1] as number) > 1) {
          const timeOfDay = getTimeOfDay(parseInt(peakHour[0]));
          patterns.push(`Often reflects during ${timeOfDay}`);
        }
      }

    } catch (vectorError) {
      console.warn('Vector-based context retrieval failed, using fallback:', vectorError);
      
      // Fallback: get recent moments and do basic analysis
      try {
        const recentMoments = await getMoments(userId, { limit: 50 });
        
        contexts = recentMoments.slice(0, limit).map(moment => ({
          momentId: moment.id,
          score: 0.5, // Default score for fallback
          preview: moment.content.substring(0, 200),
          type: moment.type,
          mood: moment.mood || null,
          emotions: moment.emotions || [],
          timestamp: moment.timestamp.toDate().getTime(),
          source: 'fallback',
        }));

        if (recentMoments.length > 0) {
          patterns.push(`Fallback analysis: ${recentMoments.length} recent entries (vector search unavailable)`);
        } else {
          patterns.push('No recent activity data available');
        }
      } catch (fallbackError) {
        console.error('Fallback context retrieval also failed:', fallbackError);
        return NextResponse.json(
          { success: false, error: 'Context retrieval failed' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      context: {
        contexts,
        patterns,
        emotionalTrends,
      },
    });

  } catch (error) {
    console.error('Error retrieving AI context:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function
function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning hours';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'late night';
}