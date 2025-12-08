import { ReflectionSuggestion, ReflectionPriority } from '@/components/ReflectionBlock';
import { runLlamaPrompt } from './vertex';

/**
 * Service for generating AI-powered reflections for journal entries
 */
export class ReflectionService {
  /**
   * Generates a contextual reflection based on the user's writing
   */
  async generateReflection(
    context: string,
    userId?: string,
    previousReflections?: ReflectionSuggestion[]
  ): Promise<ReflectionSuggestion> {
    try {
      // NEW: Route through central enhanced-chat API with source tracking
      if (userId) {
        try {
          const response = await fetch('/api/ai/enhanced-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              query: context,
              mode: 'normal',
              source: 'inline_insight', // Track that this is from journal reflection
            }),
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const insight = await response.json();

          // Map enhanced AI response to ReflectionSuggestion format
          return this.mapInsightToReflection(insight, context);
        } catch (apiError) {
          console.warn('[ReflectionService] Enhanced API failed, falling back to direct AI call:', apiError);
          // Fall through to legacy behavior
        }
      }

      // LEGACY FALLBACK: Direct AI call (when no userId or API fails)
      const prompt = this.buildReflectionPrompt(context, previousReflections);
      const response = await runLlamaPrompt(prompt);
      return this.parseAIResponse(response, context);
    } catch (error) {
      console.error('Failed to generate AI reflection:', error);
      // Final fallback to heuristic-based reflection
      return this.generateHeuristicReflection(context);
    }
  }

  /**
   * Maps enhanced AI insight response to ReflectionSuggestion format
   */
  private mapInsightToReflection(
    insight: any,
    context: string
  ): ReflectionSuggestion {
    try {
      // Extract the main response text
      const responseText = insight.response || '';

      // Try to extract a title from the first line or sentence
      const title = insight.title || this.extractTitle(responseText) || 'AI Reflection';

      // Use the response as description, truncate if too long
      const description = responseText.length > 300
        ? responseText.substring(0, 297) + '...'
        : responseText;

      // Determine priority from context or use medium as default
      const priority = this.detectPriority(context);

      return {
        id: this.generateId(),
        title,
        description,
        priority,
      };
    } catch (error) {
      console.error('Failed to map insight to reflection:', error);
      // Return a safe fallback
      return {
        id: this.generateId(),
        title: 'Reflection',
        description: insight.response || 'Take a moment to reflect on what you\'ve written.',
        priority: 'medium',
      };
    }
  }

  /**
   * Builds a prompt for the AI to generate a reflection
   */
  private buildReflectionPrompt(
    context: string,
    previousReflections?: ReflectionSuggestion[]
  ): string {
    let prompt = `You are a compassionate journaling companion helping someone reflect on their thoughts. 

The user has written:
"${context}"

${previousReflections && previousReflections.length > 0 ?
        `Previous reflections in this session:
${previousReflections.map(r => `- ${r.title}: ${r.description}`).join('\n')}

Please provide a different perspective or angle.` : ''}

Generate a thoughtful reflection that:
1. Acknowledges what they've shared
2. Offers a gentle insight or question for deeper exploration
3. Is supportive and non-judgmental
4. Helps them gain perspective

Respond in JSON format:
{
  "title": "A short, empathetic title (max 10 words)",
  "description": "A thoughtful reflection (2-3 sentences)",
  "priority": "low|medium|high based on emotional intensity"
}`;

    return prompt;
  }

  /**
   * Parses the AI response into a ReflectionSuggestion
   */
  private parseAIResponse(response: string, context: string): ReflectionSuggestion {
    try {
      // Try to parse JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: this.generateId(),
          title: parsed.title || "Something to consider",
          description: parsed.description || "Take a moment to reflect on what you've written.",
          priority: this.validatePriority(parsed.priority) || this.detectPriority(context),
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    // If parsing fails, extract what we can from the text
    return {
      id: this.generateId(),
      title: this.extractTitle(response) || "A moment of reflection",
      description: this.extractDescription(response) || response.slice(0, 200),
      priority: this.detectPriority(context),
    };
  }

  /**
   * Generates a heuristic-based reflection when AI is unavailable
   */
  private generateHeuristicReflection(context: string): ReflectionSuggestion {
    const trimmed = context.trim().toLowerCase();
    const wordCount = context.split(/\s+/).length;

    let priority: ReflectionPriority = "low";
    let title = "A moment to pause";
    let description = "What you've shared here matters. Take a moment to sit with these thoughts.";

    // Emotional keywords detection
    const emotionalKeywords = {
      high: [
        'anxious', 'worried', 'stressed', 'overwhelmed', 'scared', 'afraid',
        'panic', 'terrified', 'desperate', 'hopeless', 'crisis', 'emergency'
      ],
      medium: [
        'sad', 'lonely', 'depressed', 'hurt', 'angry', 'frustrated',
        'confused', 'lost', 'stuck', 'struggling', 'difficult', 'hard'
      ],
      positive: [
        'happy', 'grateful', 'excited', 'proud', 'accomplished', 'peaceful',
        'content', 'joyful', 'hopeful', 'confident', 'amazing', 'wonderful'
      ]
    };

    // Check for high-priority emotional content
    if (emotionalKeywords.high.some(keyword => trimmed.includes(keyword))) {
      priority = "high";
      title = "You're carrying something heavy";
      description = "These feelings are valid and important. What would it look like to approach yourself with the same compassion you'd offer a dear friend?";
    }
    // Check for medium-priority emotional content
    else if (emotionalKeywords.medium.some(keyword => trimmed.includes(keyword))) {
      priority = "medium";
      title = "Navigating challenging emotions";
      description = "You're being honest about difficult feelings. What support or understanding do you need right now?";
    }
    // Check for positive content
    else if (emotionalKeywords.positive.some(keyword => trimmed.includes(keyword))) {
      priority = "medium";
      title = "Celebrating positive moments";
      description = "You're noticing something good in your life. How can you honor and remember this feeling?";
    }
    // Questions indicate exploration
    else if (context.includes("?") && wordCount > 20) {
      priority = "medium";
      title = "Exploring important questions";
      description = "Your questions reveal what matters to you. Which answer would bring you the most clarity or peace?";
    }
    // Long entries suggest processing
    else if (wordCount > 100) {
      priority = "medium";
      title = "Processing your thoughts";
      description = "You have a lot on your mind. If you had to identify the core theme here, what would it be?";
    }
    // Relationship mentions
    else if (trimmed.match(/\b(mom|dad|parent|friend|partner|spouse|wife|husband|family)\b/)) {
      priority = "low";
      title = "Reflecting on relationships";
      description = "Relationships shape our experiences. What is this connection teaching you about yourself?";
    }
    // Work/career mentions
    else if (trimmed.match(/\b(work|job|career|boss|colleague|project|deadline)\b/)) {
      priority = "low";
      title = "Thinking about work";
      description = "Work is a significant part of life. How does this align with your broader values and goals?";
    }

    return {
      id: this.generateId(),
      title,
      description,
      priority,
    };
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  private validatePriority(priority: any): ReflectionPriority | null {
    if (["low", "medium", "high"].includes(priority)) {
      return priority as ReflectionPriority;
    }
    return null;
  }

  private detectPriority(context: string): ReflectionPriority {
    const lowercased = context.toLowerCase();
    const urgentWords = ['urgent', 'emergency', 'crisis', 'help', 'desperate'];
    const emotionalWords = ['anxious', 'stressed', 'worried', 'sad', 'angry', 'scared'];

    if (urgentWords.some(word => lowercased.includes(word))) {
      return "high";
    }
    if (emotionalWords.some(word => lowercased.includes(word))) {
      return "medium";
    }
    return "low";
  }

  private extractTitle(response: string): string | null {
    // Try to extract a title-like sentence
    const lines = response.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.length < 80) {
        return firstLine.replace(/^["']|["']$/g, '').trim();
      }
    }
    return null;
  }

  private extractDescription(response: string): string | null {
    // Try to extract the main content
    const lines = response.split('\n').filter(l => l.trim());
    if (lines.length > 1) {
      return lines.slice(1).join(' ').slice(0, 200).trim();
    }
    return lines[0]?.slice(0, 200).trim() || null;
  }
}

// Export a singleton instance
export const reflectionService = new ReflectionService();