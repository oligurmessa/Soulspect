// src/lib/vertexai.ts
import { AI_CONFIG } from '../config';
import { EmotionLog, JournalEntry, AnalyticsData } from '../../data/shared/types'

const ENDPOINT = AI_CONFIG.vertex.endpoint;
const REGION = AI_CONFIG.vertex.region;

export const runLlamaPrompt = async (prompt: string) => {
  const projectId = AI_CONFIG.vertex.projectId
  const accessToken = AI_CONFIG.vertex.accessToken || await getAccessToken()

  if (!projectId) {
    throw new Error('Google Cloud Project ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID.')
  }

  if (!accessToken) {
    throw new Error('Google Cloud access token is not available. Please ensure proper authentication.')
  }

  console.log('Using Llama 3.3 70B via Vertex AI for project:', projectId)

  try {
    const response = await fetch(
      `https://${ENDPOINT}/v1/projects/${projectId}/locations/${REGION}/endpoints/openapi/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama-3.3-70b-instruct-maas',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: false,
          max_tokens: 4000,
          temperature: 0.7
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'No response from AI'
  } catch (error) {
    console.error('Detailed Vertex AI API error:', error)
    throw error
  }
}

export const runLlamaPromptStream = async (prompt: string): Promise<ReadableStream<Uint8Array> | null> => {
  const projectId = AI_CONFIG.vertex.projectId
  const accessToken = AI_CONFIG.vertex.accessToken || await getAccessToken()

  if (!projectId || !accessToken) {
    throw new Error('Missing configuration for Vertex AI')
  }

  try {
    const response = await fetch(
      `https://${ENDPOINT}/v1/projects/${projectId}/locations/${REGION}/endpoints/openapi/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama-3.3-70b-instruct-maas',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: true,
          max_tokens: 4000,
          temperature: 0.7
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`)
    }

    return response.body
  } catch (error) {
    console.error('Detailed Vertex AI API error (stream):', error)
    throw error
  }
}

async function getAccessToken(): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: use Firebase service account credentials for Google Cloud API access
    try {
      const { GoogleAuth } = await import('google-auth-library')

      // Use the same service account credentials as Firebase
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const projectId = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID

      if (!privateKey || !clientEmail || !projectId) {
        console.warn('Missing required service account credentials for Vertex AI')
        return ''
      }

      const auth = new GoogleAuth({
        credentials: {
          private_key: privateKey,
          client_email: clientEmail,
          project_id: projectId,
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      })

      const client = await auth.getClient()
      const accessTokenResponse = await client.getAccessToken()
      return accessTokenResponse.token || ''
    } catch (error) {
      console.warn('Could not get access token via service account:', error)
      return ''
    }
  }
  return ''
}

interface InsightData {
  emotionLogs: EmotionLog[]
  journalEntries: JournalEntry[]
  analytics?: AnalyticsData
}

export const generatePersonalInsights = async (data: InsightData) => {
  const { emotionLogs, journalEntries, analytics } = data

  // Prepare data summary for AI
  const recentEmotions = emotionLogs.slice(0, 10).map(log => ({
    mood: log.mood,
    emotions: log.emotions,
    triggers: log.triggers,
    date: log.createdAt.toDate().toDateString()
  }))

  const recentJournals = journalEntries.slice(0, 5).map(entry => ({
    title: entry.title,
    content: entry.content?.substring(0, 500), // First 500 chars
    date: entry.createdAt.toDate().toDateString()
  }))

  const avgMood = analytics?.emotionStats?.averageMood || 0
  const topEmotions = analytics?.emotionStats?.emotionCounts ?
    Object.entries(analytics.emotionStats.emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count })) : []

  const topTriggers = analytics?.emotionStats?.triggerCounts ?
    Object.entries(analytics.emotionStats.triggerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trigger, count]) => ({ trigger, count })) : []

  const prompt = `As an expert emotional intelligence coach and life guidance counselor, analyze this person's emotional and journal data to provide personalized insights and recommendations. Be supportive, specific, and actionable.

DATA SUMMARY:
Average Mood: ${avgMood}/6
Recent Emotions: ${JSON.stringify(recentEmotions, null, 2)}
Top 5 Emotions: ${JSON.stringify(topEmotions, null, 2)}
Top 3 Triggers: ${JSON.stringify(topTriggers, null, 2)}
Recent Journal Themes: ${JSON.stringify(recentJournals, null, 2)}

ANALYSIS REQUESTED:
1. Emotional patterns and trends
2. Potential areas of growth
3. Specific actionable recommendations
4. Questions for deeper self-reflection
5. Strengths and positive patterns to celebrate

Please provide insights in this JSON format:
{
  "overallAssessment": "Brief overall summary of their emotional state and growth",
  "keyPatterns": ["pattern1", "pattern2", "pattern3"],
  "strengths": ["strength1", "strength2"],
  "growthAreas": ["area1", "area2"],
  "recommendations": [
    {
      "category": "Daily Practice",
      "suggestion": "specific suggestion",
      "why": "explanation of benefit"
    }
  ],
  "reflectionQuestions": ["question1", "question2", "question3"],
  "encouragement": "Personalized encouraging message"
}

Keep insights positive, growth-oriented, and personally relevant to their data patterns.`

  try {
    const response = await runLlamaPrompt(prompt)
    // Try to parse as JSON, but handle if AI doesn't return valid JSON
    try {
      return JSON.parse(response)
    } catch {
      // If not valid JSON, return a structured fallback
      return {
        overallAssessment: response,
        keyPatterns: [],
        strengths: [],
        growthAreas: [],
        recommendations: [],
        reflectionQuestions: [],
        encouragement: "Continue your journey of self-discovery. Every insight brings you closer to understanding yourself better."
      }
    }
  } catch (error) {
    console.error('Error generating insights:', error)
    throw error
  }
}

export const generateJournalPrompts = async (recentEntries: JournalEntry[], mood?: number) => {
  const themes = recentEntries.map(entry => ({
    title: entry.title,
    contentSnippet: entry.content?.substring(0, 200)
  }))

  const prompt = `Based on someone's recent journal entries and current mood (${mood || 'unknown'}/6), suggest 5 thoughtful journal prompts for deeper self-reflection. 

Recent journal themes: ${JSON.stringify(themes, null, 2)}

Provide prompts that:
- Build on their current reflection themes
- Encourage deeper exploration
- Are specific but open-ended
- Help process emotions and experiences
- Support personal growth

Return as a simple JSON array of strings: ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5"]`

  try {
    const response = await runLlamaPrompt(prompt)
    try {
      return JSON.parse(response)
    } catch {
      // Fallback prompts if JSON parsing fails
      return [
        "What patterns am I noticing in my daily experiences?",
        "How have I grown in the past month?",
        "What would I tell my younger self about today's challenges?",
        "What am I most grateful for right now?",
        "How can I show myself more compassion tomorrow?"
      ]
    }
  } catch (error) {
    console.error('Error generating prompts:', error)
    throw error
  }
}
