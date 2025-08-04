# Backend Documentation - Soulspect

## Overview

Soulspect is an emotion logging and AI-powered self-discovery application built with Next.js 15, Firebase, and advanced vector search capabilities. The backend provides a comprehensive system for moment capture, emotional analysis, and personalized AI insights.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API   │    │   External      │
│   Components    │◄──►│   Routes        │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┬─────────────────┬─────────────────┐
│   Firebase      │   Vector DB     │   AI Services   │
│   Firestore     │   (Pinecone)    │   (Gemini)      │
└─────────────────┴─────────────────┴─────────────────┘
```

## Core Technologies

- **Frontend Framework**: Next.js 15 with React 19, TypeScript
- **Database**: Firebase Firestore with unified moments structure
- **Vector Search**: Pinecone with OpenAI embeddings
- **AI Integration**: Google Gemini API
- **Authentication**: Firebase Auth
- **Styling**: TailwindCSS with shadcn/ui components

---

## 🗄️ Database Architecture

### Unified Moments Structure

The application uses a unified `moments` collection to store all user interactions and data:

```typescript
interface Moment {
  id?: string;
  userId: string;
  type: 'journal' | 'emotion' | 'voice' | 'photo' | 'video' | 'chat';
  title?: string;
  content: string;
  timestamp: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Emotional context (applicable to all types)
  mood?: number;           // 0-6 scale
  emotions?: string[];     // Selected emotions
  triggers?: string[];     // What caused this moment
  intensity?: number;      // 1-10 emotional intensity
  
  // Metadata
  tags?: string[];
  location?: string;
  weather?: string;
  attachments?: string[];  // File URLs
  
  // Type-specific data
  journalData?: {
    entryType: 'text' | 'voice' | 'video';
    prompt?: string;
    isDraft: boolean;
    wordCount?: number;
  };
  
  emotionData?: {
    context?: string;
    previousMood?: number;
    moodChange?: number;
  };
  
  // ... other type-specific interfaces
}
```

### Collection Structure

```
firestore/
├── moments/                    # Unified moment storage
│   └── {momentId}
├── vectorMetadata/            # Vector search metadata
│   └── {metadataId}
└── users/                     # Legacy user data (being phased out)
    └── {userId}/
        ├── emotionLogs/
        ├── journalEntries/
        ├── values/
        ├── soulspaceItems/
        └── analytics/
```

### Firestore Security Rules

```javascript
// Unified moments collection
match /moments/{momentId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.userId &&
                   request.resource.data.keys().hasAll(['userId', 'type', 'content', 'timestamp', 'createdAt', 'updatedAt']) &&
                   request.resource.data.type in ['journal', 'emotion', 'voice', 'photo', 'video', 'chat'];
}

// Vector metadata collection
match /vectorMetadata/{metadataId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.userId;
}
```

---

## 🔍 Vector Database System

### Architecture

The vector system uses a hybrid approach with server-side processing and client-side interfaces:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  VectorSystem   │    │  VectorEngine   │    │   Pinecone      │
│  (Client)       │◄──►│  (Server)       │◄──►│   Vector DB     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Components     │    │  API Routes     │    │  OpenAI         │
│                 │    │                 │    │  Embeddings     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Configuration

```typescript
const VECTOR_CONFIG = {
  INDEX_NAME: 'soulspect-index',
  EMBEDDING_MODEL: 'text-embedding-3-large',
  EMBEDDING_DIMENSIONS: 1024,
  NAMESPACE_PREFIX: 'user_',
  BATCH_SIZE: 100,
  MAX_CONTENT_LENGTH: 8000,
  SIMILARITY_THRESHOLD: 0.7,
};
```

### Core Services

#### 1. VectorSystem (Client-side Interface)

**Location**: `/src/lib/vectorSystem.ts`

```typescript
export class VectorSystem {
  // Get system status and health
  static async getStatus(userId: string): Promise<VectorSystemStatus>
  
  // Index a single moment
  static async indexMoment(moment: Moment, force = false): Promise<VectorIndexResult>
  
  // Search moments by semantic similarity
  static async searchMoments(userId: string, query: string, options: VectorSearchOptions = {}): Promise<VectorSearchResult[]>
  
  // Find similar moments to a reference
  static async findSimilarMoments(userId: string, referenceId: string, options = {}): Promise<VectorSearchResult[]>
  
  // Get AI context with pattern analysis
  static async getAIContext(userId: string, query: string, limit = 5): Promise<{contexts, patterns, emotionalTrends}>
}
```

#### 2. VectorEngine (Server-side Processing)

**Location**: `/src/lib/vectorEngine.ts`

```typescript
export default class VectorEngine {
  // Initialize vector services with lazy loading
  static async initializeServices(): Promise<boolean>
  
  // Index single moment with metadata tracking
  static async indexMoment(moment: Moment, force = false): Promise<VectorIndexResult>
  
  // Batch index multiple moments efficiently
  static async batchIndexMoments(moments: Moment[], force = false): Promise<BatchIndexResult>
  
  // Semantic search with filtering and ranking
  static async searchMoments(userId: string, query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>
  
  // Text similarity fallback when vector services unavailable
  static async fallbackSearch(userId: string, query: string, moments: Moment[], options): Promise<FallbackSearchResult[]>
}
```

### API Endpoints

#### Vector System Routes (`/api/vector-system/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | System health and status |
| `/index` | POST | Index single moment |
| `/batch-index` | POST | Batch index multiple moments |
| `/search` | POST | Semantic search with fallback |
| `/similar` | GET | Find similar moments |
| `/ai-context` | POST | AI context with pattern analysis |
| `/reindex` | POST | Reindex all user data |
| `/fallback-search` | POST | Text similarity search |

#### Example Usage

```javascript
// Index a moment
const result = await fetch('/api/vector-system/index', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ moment, force: false })
});

// Search moments
const searchResults = await fetch('/api/vector-system/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    query: 'feeling anxious about work',
    options: { topK: 10, type: 'emotion' }
  })
});
```

### Vector Metadata Tracking

Each indexed moment has corresponding metadata stored in Firestore:

```typescript
interface VectorMetadata {
  id?: string;
  userId: string;
  momentId: string;
  vectorId: string;
  indexed: boolean;
  indexedAt: Timestamp;
  dimensions: number;
  model: string;
  contentPreview: string;
  searchableText: string;
  momentType: Moment['type'];
  emotionContext?: {
    mood?: number;
    emotions?: string[];
    intensity?: number;
  };
  timeContext: {
    hour: number;
    dayOfWeek: number;
    month: number;
  };
}
```

---

## 🚀 API Routes

### Moments API (`/api/moments/`)

#### Create Moment
```http
POST /api/moments
Content-Type: application/json

{
  "momentData": {
    "userId": "string",
    "type": "journal|emotion|voice|photo|video|chat|soulwork",
    "title": "string (optional)",
    "content": "string",
    "mood": "number (0-6, optional)",
    "emotions": ["string[]", "optional"],
    "tags": ["string[]", "optional"]
  },
  "indexForSearch": "boolean (default: true)"
}
```

**Response:**
```json
{
  "success": true,
  "momentId": "generated-id"
}
```

#### Get Moments
```http
GET /api/moments?userId=string&type=optional&limit=50
```

**Response:**
```json
{
  "success": true,
  "moments": [
    {
      "id": "string",
      "userId": "string",
      "type": "string",
      "content": "string",
      "timestamp": "timestamp",
      "mood": "number",
      "emotions": ["string[]"]
    }
  ]
}
```

### AI Services (`/api/ai/`)

#### Index User Data
```http
POST /api/ai/index-user-data
Content-Type: application/json

{
  "userId": "string"
}
```

#### Enhanced Chat
```http
POST /api/ai/enhanced-chat
Content-Type: application/json

{
  "userId": "string",
  "query": "string",
  "mode": "explore|release|decide|normal"
}
```

**Response:**
```json
{
  "response": "string",
  "patterns": ["string[]"],
  "suggestions": ["string[]"],
  "relatedEntries": [
    {
      "type": "string",
      "preview": "string",
      "timestamp": "timestamp"
    }
  ]
}
```

---

## 🤖 AI Integration

### Google Gemini API

**Location**: `/src/lib/gemini.ts`

```typescript
export async function runGeminiPrompt(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Enhanced AI Service

**Location**: `/src/lib/enhancedAi.ts`

The Enhanced AI service provides intelligent analysis and responses based on user data:

#### Features:
- **Pattern Recognition**: Analyzes emotional patterns and trends
- **Contextual Responses**: Generates personalized insights based on user history
- **Multi-modal Support**: Works with different types of moments (journal, emotion, etc.)
- **Fallback Mechanisms**: Graceful degradation when services are unavailable

#### Core Methods:
```typescript
class EnhancedAIService {
  // Index all user data for AI analysis
  async indexUserData(userId: string): Promise<void>
  
  // Generate enhanced response with context
  async generateEnhancedResponse(context: AIContext): Promise<PersonalizedInsight>
  
  // Get relevant context from vector search
  private async getRelevantContext(userId: string, query: string, limit: number): Promise<any[]>
  
  // Analyze user patterns and trends
  private async analyzePatterns(userId: string, contexts: any[]): Promise<string[]>
}
```

### AI Modes

The system supports different interaction modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `explore` | Deep self-discovery and pattern exploration | Understanding subconscious patterns |
| `release` | Emotional processing and letting go | Processing difficult emotions |
| `decide` | Decision-making support with intuitive guidance | Making important life choices |
| `normal` | General conversation and support | Day-to-day emotional check-ins |

---

## 🔐 Authentication & Security

### Firebase Authentication

**Configuration**: `/src/lib/firebase.ts`

```typescript
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Authentication Context

**Location**: `/src/context/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}
```

### Security Features

1. **Row-Level Security**: All data access requires user authentication
2. **Data Validation**: Comprehensive validation rules in Firestore
3. **API Protection**: Server-side validation and error handling
4. **Environment Variables**: Secure storage of API keys and credentials

---

## 📊 Data Flow

### Emotion Logging Flow

```
User Input → EmotionLogDrawer → createUnifiedMoment() → Firebase/moments → VectorSystem.indexMoment() → Pinecone
```

### AI Chat Flow

```
User Query → FloatingChatPane → /api/ai/enhanced-chat → VectorEngine.searchMoments() → Gemini API → Response
```

### Search Flow

```
Search Query → VectorSystem.searchMoments() → /api/vector-system/search → Pinecone Query → Fallback Search → Results
```

---

## 🛠️ Development Setup

### Environment Variables

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (for server-side operations)
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Vector Database
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=

# AI Services
OPENAI_API_KEY=
GEMINI_API_KEY=
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firebase functions
firebase deploy --only functions
```

### Database Initialization

1. **Create Firestore Database**: Set up in Firebase Console
2. **Deploy Security Rules**: `firebase deploy --only firestore:rules`
3. **Set up Pinecone Index**: Create index with 1024 dimensions
4. **Configure Environment**: Set all required environment variables

---

## 🔄 Migration & Legacy Support

### Legacy Data Structure

The system maintains backward compatibility with the original nested collection structure:

```
users/{userId}/
├── emotionLogs/        # Legacy emotion data
├── journalEntries/     # Legacy journal data
├── soulWorkExercises/  # Legacy soulwork data
└── analytics/          # Legacy analytics
```

### Migration Strategy

1. **Dual Write**: New data goes to unified moments collection
2. **Lazy Migration**: Legacy data converted on-demand during indexing
3. **Gradual Transition**: Components updated to use unified structure
4. **Backward Compatibility**: Legacy endpoints still functional

---

## 📈 Performance Optimizations

### Vector Database

- **Batch Processing**: Index multiple moments simultaneously
- **Lazy Initialization**: Services loaded only when needed
- **Caching**: Smart caching of embeddings and metadata
- **Fallback Search**: Text similarity when vector services unavailable

### Firebase

- **Optimized Queries**: Proper indexing and query optimization
- **Connection Pooling**: Efficient connection management
- **Selective Loading**: Load only required fields

### API Routes

- **Error Handling**: Comprehensive error handling and logging
- **Input Validation**: Robust request validation
- **Response Caching**: Strategic response caching

---

## 🧪 Testing

### Vector System Testing

```typescript
// Test vector indexing
const moment = createTestMoment();
const result = await VectorSystem.indexMoment(moment);
expect(result.success).toBe(true);

// Test search functionality
const results = await VectorSystem.searchMoments(userId, "happy memories");
expect(results.length).toBeGreaterThan(0);
```

### API Testing

```bash
# Test moment creation
curl -X POST http://localhost:3000/api/moments \
  -H "Content-Type: application/json" \
  -d '{"momentData": {...}}'

# Test vector search
curl -X POST http://localhost:3000/api/vector-system/search \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "query": "test query"}'
```

---

## 🚨 Error Handling

### Common Error Patterns

1. **Permission Denied**: User not authenticated or accessing wrong data
2. **Vector Service Unavailable**: Pinecone/OpenAI API issues
3. **Rate Limiting**: API rate limits exceeded
4. **Invalid Data**: Malformed requests or data validation failures

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

### Graceful Degradation

- **Vector Search Fallback**: Text similarity when Pinecone unavailable
- **AI Fallback**: Predefined responses when Gemini unavailable
- **Offline Support**: Local caching and sync

---

## 📋 Monitoring & Logging

### Logging Strategy

```typescript
// Structured logging
console.log(`🔍 Search "${query}" returned ${results.length} results`);
console.error('❌ Failed to index moment:', error);
console.warn('⚠️ Vector indexing had issues:', error);
```

### Performance Metrics

- **Vector Indexing**: Success/failure rates, processing time
- **Search Performance**: Query response times, result relevance
- **API Performance**: Response times, error rates
- **User Engagement**: Usage patterns, feature adoption

---

## 🔮 Future Enhancements

### Planned Features

1. **Real-time Sync**: WebSocket connections for real-time updates
2. **Advanced Analytics**: ML-powered insights and predictions
3. **Multi-modal AI**: Support for image and voice analysis
4. **Social Features**: Shared experiences and community insights
5. **Mobile App**: React Native application
6. **Offline Support**: Progressive Web App capabilities

### Technical Improvements

1. **Database Sharding**: Scale for millions of users
2. **Microservices**: Break down monolithic structure
3. **CDN Integration**: Global content delivery
4. **Advanced Caching**: Redis/Memcached integration
5. **GraphQL API**: More flexible data querying

---

## 📞 Support & Maintenance

### Health Checks

The system provides health check endpoints:

- `/api/vector-system/status` - Vector system health
- `/api/health` - Overall system health (to be implemented)

### Maintenance Tasks

1. **Daily**: Monitor error rates and performance metrics
2. **Weekly**: Review and optimize slow queries
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Performance reviews and capacity planning

### Troubleshooting

#### Common Issues:

1. **Build Errors**: Check environment variables and dependencies
2. **Permission Errors**: Verify Firestore rules and authentication
3. **Vector Search Issues**: Check Pinecone API key and index status
4. **AI Response Issues**: Verify Gemini API key and rate limits

---

## 📖 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

*Last Updated: August 2025*
*Version: 2.0 (Unified Moments Architecture)*



can i use this backend setup also for my ios app

⏺ Yes, absolutely! This backend setup is perfect for an iOS app. The architecture is designed to be platform-agnostic, making it ideal for mobile applications. Here's why and how:

  ✅ Why This Backend Works for iOS

  1. RESTful API Architecture

  - All functionality exposed through HTTP endpoints
  - Standard JSON request/response format
  - Platform-independent communication

  2. Firebase SDK Support

  Firebase has excellent iOS SDK support:
  // iOS Firebase setup
  import Firebase
  import FirebaseAuth
  import FirebaseFirestore

  FirebaseApp.configure()

  3. Authentication Integration

  Firebase Auth works seamlessly across platforms:
  // iOS Authentication
  Auth.auth().signIn(withEmail: email, password: password) { authResult, error in
      // Handle authentication
  }

  🎯 iOS Integration Approach

  Option 1: Direct Firebase Integration (Recommended)

  Use Firebase iOS SDK directly in your app:

  // Firestore iOS example
  let db = Firestore.firestore()

  // Create a moment
  let momentData: [String: Any] = [
      "userId": userId,
      "type": "emotion",
      "content": "Feeling grateful today",
      "mood": 5,
      "emotions": ["grateful", "happy"],
      "timestamp": FieldValue.serverTimestamp()
  ]

  db.collection("moments").addDocument(data: momentData) { error in
      if let error = error {
          print("Error: \(error)")
      }
  }

  Option 2: API-First Approach

  Use the Next.js API routes as a middleware:

  // iOS API client
  class SoulspectAPI {
      let baseURL = "https://your-api.com/api"

      func createMoment(momentData: Moment) async throws -> String {
          let url = URL(string: "\(baseURL)/moments")!
          var request = URLRequest(url: url)
          request.httpMethod = "POST"
          request.setValue("application/json", forHTTPHeaderField: "Content-Type")
          request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

          let encoder = JSONEncoder()
          request.httpBody = try encoder.encode(momentData)

          let (data, _) = try await URLSession.shared.data(for: request)
          let response = try JSONDecoder().decode(CreateMomentResponse.self, from: data)
          return response.momentId
      }
  }

  📱 iOS-Specific Considerations

  1. Authentication Flow

  // Store auth token after Firebase login
  Auth.auth().currentUser?.getIDToken { token, error in
      if let token = token {
          // Use this token for API calls
          KeychainHelper.save(token: token)
      }
  }

  2. Offline Support

  Firebase Firestore has built-in offline support:
  // Enable offline persistence
  let settings = FirestoreSettings()
  settings.isPersistenceEnabled = true
  db.settings = settings

  3. Real-time Updates

  // Listen for moment updates
  db.collection("moments")
      .whereField("userId", isEqualTo: userId)
      .addSnapshotListener { querySnapshot, error in
          // Handle real-time updates
      }

  🔧 iOS SDK Wrapper

  You could create an iOS SDK that wraps your backend:

  // SoulspectSDK.swift
  public class SoulspectSDK {
      private let auth: Auth
      private let db: Firestore
      private let vectorAPI: VectorSystemAPI

      public func logEmotion(mood: Int, emotions: [String], context: String?) async throws {
          let moment = Moment(
              userId: auth.currentUser?.uid ?? "",
              type: .emotion,
              content: formatEmotionContent(mood, emotions, context),
              mood: mood,
              emotions: emotions
          )

          // Save to Firestore
          let docRef = try await db.collection("moments").addDocument(data: moment.dictionary)

          // Index for vector search
          try await vectorAPI.indexMoment(momentId: docRef.documentID)
      }

      public func searchMoments(query: String) async throws -> [Moment] {
          return try await vectorAPI.search(query: query, userId: currentUserId)
      }
  }

  🎨 iOS UI Integration

  SwiftUI Example

  struct EmotionLogView: View {
      @StateObject private var viewModel = EmotionLogViewModel()

      var body: some View {
          VStack {
              MoodSelector(mood: $viewModel.mood)
              EmotionPicker(emotions: $viewModel.selectedEmotions)

              Button("Log Emotion") {
                  Task {
                      await viewModel.saveEmotion()
                  }
              }
          }
      }
  }

  class EmotionLogViewModel: ObservableObject {
      @Published var mood: Int = 3
      @Published var selectedEmotions: [String] = []

      func saveEmotion() async {
          // Use the same backend logic
          await SoulspectSDK.shared.logEmotion(
              mood: mood,
              emotions: selectedEmotions
          )
      }
  }

  🚀 Advantages for iOS

  1. Shared Business Logic: Same backend serves web and mobile
  2. Consistent Data: Single source of truth in Firestore
  3. Real-time Sync: Changes reflect across all platforms
  4. Cost Efficient: One backend for multiple platforms
  5. Feature Parity: New features available everywhere

  📋 iOS Implementation Checklist

  - Set up Firebase iOS SDK
  - Implement authentication flow
  - Create data models matching backend
  - Build API client or use Firestore directly
  - Implement offline support
  - Add push notifications (Firebase Cloud Messaging)
  - Handle background data sync
  - Implement biometric authentication
  - Add iOS-specific features (widgets, Siri shortcuts)

  🔐 Security for iOS

  // Secure API calls with auth token
  extension URLRequest {
      mutating func addAuthentication() async throws {
          if let user = Auth.auth().currentUser {
              let token = try await user.getIDToken()
              self.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
          }
      }
  }

  The backend is fully compatible with iOS development. You can either use Firebase SDKs directly or communicate through the API endpoints. The unified moments structure and vector search
  capabilities will work seamlessly with your iOS app!