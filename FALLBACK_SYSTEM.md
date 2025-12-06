# SoulSpect Fallback System Architecture

## Overview

The SoulSpect AI system is designed with multiple layers of fallback logic to ensure the application **never breaks**, even when individual services are unavailable. This document outlines the complete fallback strategy and how to customize it.

## 🏗️ **Fallback Hierarchy**

### **Primary Pipeline**
```
User Input → Qwen3-Embedding-8B → ChromaDB → Llama 3.3 70B → Response
```

### **Graceful Degradation Levels**

#### **Level 1: Vector Search Fallback**
When ChromaDB is unavailable:
```javascript
// Location: src/lib/enhancedAi.ts:299-309
try {
  relevantContext = await this.getRelevantContext(userId, query);
} catch (vectorError) {
  console.warn('Vector search failed, using basic response mode:', vectorError);
  // Falls back to direct database queries
}
```

#### **Level 2: Embedding Service Fallback**
When DeepInfra/Qwen3 is unavailable:
```javascript
// Location: src/lib/enhancedAi.ts:509-518
try {
  const [journals, emotions] = await Promise.all([
    getJournalEntriesServer(userId, 30),
    getEmotionLogsServer(userId, 30),
  ]);
  patterns = FallbackVectorService.findPatterns({ journals, emotions });
} catch (error) {
  console.error('Error finding fallback patterns:', error);
}
```

#### **Level 3: AI Service Fallback**
When Llama 3.3 70B is unavailable:
```javascript
// Location: src/lib/enhancedAi.ts:359-367
try {
  const basicPrompt = this.getBasicPrompt(context.mode || 'normal', context.currentQuery);
  const response = await runLlamaPrompt(basicPrompt);
  return { response };
} catch (fallbackError) {
  return {
    response: "I'm here to listen and support you. Could you tell me more about what's on your mind?"
  };
}
```

## 🔧 **Service-Level Fallbacks**

### **Enhanced AI Service** (`src/lib/enhancedAi.ts`)

#### **Context Retrieval Fallback Chain:**
1. **Moment-based vector search** (New system)
2. **Direct moments database query** (Text-based search)
3. **Legacy vector search** (Pinecone compatibility)
4. **Basic text similarity** (FallbackVectorService)
5. **Empty context** (Basic response mode)

```javascript
// Priority 1: Vector search on moments
const momentResults = await momentVectorService.searchMoments(userId, query);

// Priority 2: Direct database search
const moments = await getMomentsServer(userId, 50);
const relevantMoments = moments.filter(moment => {
  const content = (moment.title + ' ' + moment.content).toLowerCase();
  return searchTerms.some(term => content.includes(term));
});

// Priority 3: Legacy vector DB
const results = await vectorDb.search(userId, query);

// Priority 4: Basic text similarity
const fallbackResults = await FallbackVectorService.searchSimilar(query, { journals, emotions });
```

#### **Response Generation Fallback:**
1. **Enhanced contextual response** (with vector data)
2. **Basic contextual response** (with database data only)
3. **Generic supportive response** (no data)

### **Vector Database Service** (`src/lib/vectorDbChroma.ts`)

#### **ChromaDB Fallback Strategy:**
1. **HTTP API client** (Primary: direct REST calls)
2. **JavaScript SDK client** (Secondary: if HTTP fails)
3. **Legacy Pinecone compatibility** (Tertiary: for old data)
4. **Direct database access** (Final: bypass vector entirely)

### **Embedding Service** (`src/lib/embeddingService.ts`)

#### **Embedding Generation Fallback:**
1. **DeepInfra Qwen3-Embedding-8B** (Primary)
2. **Error handling with meaningful messages** (No automatic fallback)
3. **Graceful degradation**: Vector operations skip when embeddings fail

## 📝 **Customizing Fallback Behavior**

### **Adding New Fallback Levels**

#### **1. Service-Level Fallback**
```javascript
// Example: Adding OpenAI embeddings as fallback
export class EmbeddingService {
  async createEmbedding(text: string): Promise<number[]> {
    try {
      // Primary: DeepInfra
      return await this.createDeepInfraEmbedding(text);
    } catch (error) {
      console.warn('DeepInfra failed, trying OpenAI fallback');
      // Fallback: OpenAI
      return await this.createOpenAIEmbedding(text);
    }
  }
}
```

#### **2. Response-Level Fallback**
```javascript
// Example: Adding cached responses
async generateEnhancedResponse(context: AIContext): Promise<PersonalizedInsight> {
  try {
    // Primary: Full AI pipeline
    return await this.fullAIPipeline(context);
  } catch (error) {
    // Fallback: Check cache
    const cachedResponse = await this.getCachedResponse(context.currentQuery);
    if (cachedResponse) return cachedResponse;
    
    // Final: Static response
    return { response: this.getStaticFallback(context.mode) };
  }
}
```

### **Configuration Options**

#### **Environment Variables for Fallback Control**
```bash
# Enable/disable specific fallback levels
ENABLE_VECTOR_FALLBACK=true
ENABLE_AI_FALLBACK=true
ENABLE_CACHE_FALLBACK=true

# Timeout configurations
VECTOR_SEARCH_TIMEOUT=5000
AI_RESPONSE_TIMEOUT=10000
EMBEDDING_TIMEOUT=3000

# Fallback thresholds
MIN_CONTEXT_ITEMS=2
MIN_SIMILARITY_SCORE=0.7
```

#### **Code Configuration**
```javascript
// Location: src/lib/enhancedAi.ts
const FALLBACK_CONFIG = {
  enableVectorFallback: process.env.ENABLE_VECTOR_FALLBACK !== 'false',
  enableAIFallback: process.env.ENABLE_AI_FALLBACK !== 'false',
  minContextItems: parseInt(process.env.MIN_CONTEXT_ITEMS || '2'),
  vectorTimeout: parseInt(process.env.VECTOR_SEARCH_TIMEOUT || '5000'),
};
```

## 🚨 **Error Handling Patterns**

### **Non-Breaking Error Strategy**
```javascript
// ✅ Good: Log and continue
try {
  await riskySoervice.call();
} catch (error) {
  console.warn('Service unavailable, using fallback:', error);
  // Continue with fallback logic
}

// ❌ Bad: Break the entire flow
try {
  await riskyService.call();
} catch (error) {
  throw error; // This breaks the user experience
}
```

### **User-Friendly Error Messages**
```javascript
const ERROR_MESSAGES = {
  vector_unavailable: "Using basic search (enhanced search temporarily unavailable)",
  ai_unavailable: "Providing standard response (AI insights temporarily unavailable)", 
  embedding_unavailable: "Using text-based matching (semantic search temporarily unavailable)"
};
```

## 📊 **Monitoring Fallback Usage**

### **Logging Strategy**
```javascript
// Location: Throughout codebase
console.log('[AI] Using primary vector search');           // Success
console.warn('[AI] Vector search failed, using fallback'); // Fallback
console.error('[AI] All systems failed, using static');    // Critical
```

### **Analytics Integration**
```javascript
// Example: Track fallback usage
const analytics = {
  vectorFallbacks: 0,
  aiFallbacks: 0,
  embeddingFallbacks: 0,
};

// Increment when fallbacks are used
analytics.vectorFallbacks++;
```

## 🔄 **Testing Fallback Systems**

### **Manual Testing**
```bash
# Test without ChromaDB
CHROMA_URL="" npm run dev

# Test without DeepInfra  
DEEPINFRA_API_KEY="" npm run dev

# Test without Vertex AI
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID="" npm run dev
```

### **Diagnostics Endpoint**
Visit `/api/diagnostics` to see real-time service status and fallback states.

## 🎯 **Best Practices**

### **1. Fail Gracefully**
- Never throw unhandled errors that break the UI
- Always provide meaningful fallback responses
- Log fallback usage for monitoring

### **2. Maintain User Experience**
- Fallback responses should still be helpful
- Don't expose technical errors to users  
- Provide context about reduced functionality

### **3. Design for Recovery**
- Services should automatically retry when available
- Cache successful responses for future fallbacks
- Monitor fallback frequency for system health

### **4. Test Regularly**
- Include fallback scenarios in testing
- Simulate service outages
- Verify user experience in degraded modes

## 🔮 **Future Enhancements**

### **Planned Fallback Improvements**
1. **Response Caching**: Cache successful AI responses for reuse
2. **Service Health Checking**: Automatic retry logic when services recover
3. **Progressive Enhancement**: Gradually restore functionality as services come online
4. **Fallback Analytics**: Dashboard for monitoring fallback usage patterns

This fallback system ensures SoulSpect provides a consistent, reliable user experience regardless of external service availability.