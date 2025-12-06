# SoulSpect Prompt Engineering Guide

## Overview

This document outlines the prompt engineering architecture for SoulSpect's AI system, including system prompts, context injection, and customization patterns for the Llama 3.3 70B model via Vertex AI.

## 🧠 **Core Prompt Architecture**

### **System Role Definitions**

SoulSpect uses **mode-based prompting** where the AI adopts different personas based on user intent:

#### **Mode: `explore`** 
```javascript
// Location: src/lib/enhancedAi.ts:414
"You are a wise guide helping someone explore their subconscious mind and inner patterns."
```
**Purpose**: Deep self-discovery, pattern recognition, unconscious mind exploration
**Tone**: Wise, intuitive, encouraging deeper reflection

#### **Mode: `release`**
```javascript  
// Location: src/lib/enhancedAi.ts:415
"You are a healing companion helping someone release what no longer serves them."
```
**Purpose**: Emotional healing, letting go, transformation
**Tone**: Gentle, supportive, focused on healing and growth

#### **Mode: `decide`**
```javascript
// Location: src/lib/enhancedAi.ts:416  
"You are a clarity guide helping someone make important decisions."
```
**Purpose**: Decision-making support, clarity, connecting with inner wisdom
**Tone**: Empowering, trust-building, focused on inner knowing

#### **Mode: `normal`** (Default)
```javascript
// Location: src/lib/enhancedAi.ts:417
"You are a supportive companion in someone's journey of self-discovery and inner transformation."
```
**Purpose**: General support, everyday interactions, emotional companionship
**Tone**: Warm, understanding, gentle guidance

## 📝 **Prompt Construction Pipeline**

### **1. Enhanced Prompt (With Context)**
**Location**: `src/lib/enhancedAi.ts:407-462`

```javascript
const buildEnhancedPrompt = (context, relevantContext, emotionalPatterns, similarExperiences) => {
  return `${basePrompt}

USER QUERY: "${context.currentQuery}"

PERSONAL CONTEXT:
${personalContext}

RELEVANT PAST ENTRIES:
${relevantContext}

SIMILAR EXPERIENCES:
${similarExperiences}

INSTRUCTIONS:
${instructions}

Respond in 2-4 sentences with genuine insight and compassionate guidance.`;
}
```

#### **Context Injection Strategy:**
1. **Emotional State**: Current mood trends, dominant emotions, triggers
2. **Historical Data**: Relevant past journal entries and experiences  
3. **Behavioral Patterns**: Recurring themes and emotional cycles
4. **Temporal Context**: Time-based insights and triggers

### **2. Basic Prompt (No Context)**
**Location**: `src/lib/enhancedAi.ts:569-577`

```javascript
const getBasicPrompt = (mode, query) => {
  return `${modePrompts[mode]}

The person has shared: "${query}"

Respond with empathy and genuine insight. Ask thoughtful follow-up questions to encourage deeper reflection. Avoid making assumptions about their emotional state or history. Keep your response to 2-3 sentences and focus on being present and supportive.`;
}
```

## 🎯 **Context-Aware Prompting**

### **Personal Context Assembly**
**Location**: `src/lib/enhancedAi.ts:422-443`

```javascript
// Emotional state context
if (emotionalPatterns?.moodTrend?.trend) {
  personalContext += `- Current Emotional State: Mood trending ${trend}, average ${avgMood}/6\n`;
}

// Dominant emotions
if (emotionalPatterns?.dominantEmotions?.length > 0) {
  personalContext += `- Dominant Emotions Recently: ${emotions.join(', ')}\n`;
}

// Key triggers
if (emotionalPatterns?.triggerPatterns?.length > 0) {
  personalContext += `- Key Triggers: ${triggers.join(', ')}\n`;
}
```

### **Historical Context Integration**
**Location**: `src/lib/enhancedAi.ts:445-453`

```javascript
// Past entries with relevance scoring
const contextSection = relevantContext.length > 0 ? 
  `RELEVANT PAST ENTRIES:
  ${relevantContext.slice(0, 3).map((ctx, i) => 
    `${i + 1}. [${ctx.type}] ${ctx.preview} (Relevance: ${(ctx.relevanceScore * 100).toFixed(0)}%)`
  ).join('\n')}` : '';

// Similar experiences with timestamps  
const experiencesSection = similarExperiences.length > 0 ?
  `SIMILAR EXPERIENCES:
  ${similarExperiences.slice(0, 2).map((exp, i) => 
    `${i + 1}. "${exp.preview}" (${new Date(exp.timestamp).toLocaleDateString()})`
  ).join('\n')}` : '';
```

## 🔧 **Customization Patterns**

### **Mode-Specific Chat Interface**
**Location**: `src/app/(protected)/dashboard/soulspace/page.tsx:200-205`

```javascript
const modeContext = {
  explore: "You are a wise guide helping someone explore their subconscious mind and inner patterns. Respond with deep, insightful questions and reflections that help them uncover hidden truths about themselves.",
  
  release: "You are a healing companion helping someone release what no longer serves them. Focus on transformation, letting go, and creating space for new growth.",
  
  decide: "You are a clarity guide helping someone make important decisions. Help them connect with their inner wisdom and intuition.",
  
  normal: "You are a supportive companion in someone's journey of self-discovery and inner transformation."
};
```

### **User Input Processing**
**Location**: `src/app/(protected)/dashboard/soulspace/page.tsx:136-151`

```javascript
// Detect message type from content
const detectMessageType = (content: string): Message['type'] => {
  if (content.startsWith('[Explore Subconscious:')) return 'explore';
  if (content.startsWith('[Release:')) return 'release';  
  if (content.startsWith('[Decide:')) return 'decide';
  return 'normal';
};

// Clean message content (remove prefixes)
const cleanMessage = (content: string): string => {
  return content
    .replace(/^\[Explore Subconscious:\s*/, '')
    .replace(/^\[Release:\s*/, '')
    .replace(/^\[Decide:\s*/, '')
    .replace(/\]$/, '');
};
```

## 📊 **Insights Generation Prompts**

### **Personal Insights Prompt**
**Location**: `src/lib/vertexai.ts:67-100`

```javascript
const generatePersonalInsights = async (data: InsightData) => {
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

Keep insights positive, growth-oriented, and personally relevant to their data patterns.`;
};
```

### **Journal Prompts Generation**
**Location**: `src/lib/vertexai.ts:125-142`

```javascript
const generateJournalPrompts = async (recentEntries, mood) => {
  const prompt = `Based on someone's recent journal entries and current mood (${mood || 'unknown'}/6), suggest 5 thoughtful journal prompts for deeper self-reflection. 

Recent journal themes: ${JSON.stringify(themes, null, 2)}

Provide prompts that:
- Build on their current reflection themes
- Encourage deeper exploration
- Are specific but open-ended
- Help process emotions and experiences
- Support personal growth

Return as a simple JSON array of strings: ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5"]`;
};
```

## 🎨 **Response Formatting**

### **Response Length Guidelines**
```javascript
// Enhanced responses: 2-4 sentences
"Respond in 2-4 sentences with genuine insight and compassionate guidance."

// Basic responses: 2-3 sentences  
"Keep your response to 2-3 sentences and focus on being present and supportive."

// Chat responses: 1-3 sentences
"Respond as a compassionate guide in 1-3 sentences. Be authentic, insightful, and helpful."
```

### **Tone Requirements**
- **Authentic**: Genuine, not formulaic
- **Insightful**: Provides meaningful reflection
- **Supportive**: Encouraging and non-judgmental
- **Personal**: Specific to user's context and history
- **Growth-oriented**: Focuses on positive development

## 🛡️ **Safety & Ethical Guidelines**

### **Built-in Safety Instructions**
```javascript
const safetyGuidelines = `
INSTRUCTIONS:
1. Acknowledge their current query with genuine understanding
2. Reference specific past experiences when available
3. Provide insights that connect patterns across their journey
4. Offer specific, actionable guidance based on their history
5. Be deeply personal and avoid generic responses
6. If you notice concerning patterns, gently bring awareness
7. Celebrate growth and positive changes when evident
`;
```

### **Fallback for Concerning Content**
```javascript
// When concerning patterns are detected
if (hasConcerningPatterns) {
  additionalInstructions += `
  - Gently acknowledge their struggles with compassion
  - Suggest professional support when appropriate  
  - Focus on hope and available resources
  - Avoid diagnostic language or medical advice
  `;
}
```

## 🎛️ **Advanced Customization**

### **Adding New Modes**
```javascript
// 1. Add mode definition
const modePrompts = {
  // Existing modes...
  manifest: "You are a manifestation guide helping someone align their desires with inspired action.",
  shadow: "You are a shadow work guide helping someone integrate their unconscious aspects."
};

// 2. Add detection logic
const detectMessageType = (content: string) => {
  if (content.startsWith('[Manifest:')) return 'manifest';
  if (content.startsWith('[Shadow:')) return 'shadow';
  // Existing logic...
};

// 3. Add mode-specific instructions
const getModeInstructions = (mode: string) => {
  switch (mode) {
    case 'manifest':
      return "Focus on practical steps, visualization, and aligned action.";
    case 'shadow':
      return "Create safe space for exploring difficult emotions with compassion.";
    // Existing modes...
  }
};
```

### **Context-Specific Prompting**
```javascript
// Customize prompts based on data availability
const buildDynamicPrompt = (hasEmotionalData, hasJournalData, hasVectorData) => {
  let instructions = baseInstructions;
  
  if (hasEmotionalData) {
    instructions += "\n- Reference emotional patterns and provide mood-aware guidance";
  }
  
  if (hasJournalData) {
    instructions += "\n- Connect current query to past journal themes"; 
  }
  
  if (hasVectorData) {
    instructions += "\n- Use semantic connections to provide deeper insights";
  }
  
  return instructions;
};
```

### **Temporal Context Integration**
```javascript
// Add time-aware context
const addTemporalContext = (timestamp) => {
  const hour = new Date(timestamp).getHours();
  const dayOfWeek = new Date(timestamp).getDay();
  
  let temporalContext = "";
  
  if (hour >= 20 || hour < 6) {
    temporalContext += "- Time context: Late evening/night - focus on reflection and rest\n";
  } else if (hour >= 6 && hour < 12) {
    temporalContext += "- Time context: Morning - focus on intention setting and energy\n";
  }
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    temporalContext += "- Day context: Weekend - more space for deeper exploration\n";
  }
  
  return temporalContext;
};
```

## 🔍 **Testing & Validation**

### **Prompt Testing Framework**
```javascript
// Test different prompt variations
const testPromptVariations = async (baseQuery) => {
  const variations = [
    { context: 'minimal', data: minimalData },
    { context: 'rich', data: richData }, 
    { context: 'emotional', data: emotionalData }
  ];
  
  for (const variation of variations) {
    const response = await generateResponse(baseQuery, variation);
    console.log(`${variation.context}: ${response}`);
  }
};
```

### **Response Quality Metrics**
- **Relevance**: Does the response address the user's query?
- **Personalization**: Does it use their specific context and history?
- **Actionability**: Does it provide concrete next steps?
- **Tone**: Is it supportive and appropriate for the mode?
- **Length**: Is it concise yet meaningful?

## 🚀 **Future Enhancements**

### **Planned Prompt Improvements**
1. **Adaptive Learning**: Prompts that evolve based on user preferences
2. **Multi-turn Context**: Maintaining conversation context across multiple exchanges
3. **Sentiment-Aware Prompting**: Adjusting tone based on detected emotional state
4. **Goal-Oriented Prompting**: Connecting responses to user's stated goals
5. **Cultural Sensitivity**: Adapting language and concepts for diverse backgrounds

### **Advanced Features**
1. **Prompt Templates**: User-customizable prompt templates
2. **Voice & Tone Profiles**: Consistent personality across interactions
3. **Domain-Specific Modes**: Specialized prompts for work, relationships, health, etc.
4. **Interactive Prompt Building**: UI for users to modify their AI companion's behavior

This prompt engineering system enables SoulSpect to provide deeply personalized, contextually aware AI interactions that support genuine personal growth and self-discovery.