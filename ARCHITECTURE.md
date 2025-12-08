# SoulSpect Architecture Overview

## Executive Summary

SoulSpect is a Next.js 15 application built as an AI-powered moment capturing system. The core philosophy is to provide a single, unified interface for capturing life moments in multiple modalities (text, video, photos, emotions, voice) and using AI to provide contextual insights through vector search and semantic understanding.

## 1. Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Runtime**: React 19 with TypeScript
- **Styling**: TailwindCSS with dark mode support
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **AI/ML**: 
  - Google Gemini API (insights)
  - Pinecone Vector Database (semantic search)
  - OpenAI API (embeddings, transcription)
  - ChromaDB (alternative vector store)
- **UI Components**: Radix UI primitives with shadcn/ui styling

### Application Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (protected)/        # Authenticated routes
│   │   └── dashboard/      # Main app features
│   │       ├── log/        # PRIMARY: Unified capture interface
│   │       ├── journal/    # Historical data view
│   │       ├── soulspace/  # AI chat interface
│   │       └── moments/    # Moments management
│   ├── api/                # API routes
│   │   ├── ai/            # AI-related endpoints
│   │   ├── moments/       # Moment CRUD operations
│   │   └── data-sync/     # Data migration/sync
│   ├── auth/              # Authentication flows
│   └── [public pages]     # Landing, login, etc.
├── components/            # React components
├── context/              # React contexts (AuthContext)
├── lib/                  # Core business logic
├── hooks/               # Custom React hooks
└── types/              # TypeScript definitions
```

## 2. Feature Areas

### 2.1 Core Features

#### **Log Page** (`/dashboard/log`) - PRIMARY INTERFACE
- **Purpose**: Single entry point for all moment capture
- **Components**:
  - `BlockEditor`: Rich text editing with TipTap
  - `VideoRecorder`: Video capture and recording
  - `AttachmentPanel`: Photo/media attachments
  - `EmotionAnchor`: Emotion logging overlay
  - `FloatingChatPane`: AI chat with context
- **Capabilities**:
  - Text journaling with AI reflections
  - Video recording with future ML captioning
  - Photo carousel with captions
  - Emotion/mood tracking
  - Voice notes (future)

#### **Journal/Moments Page** (`/dashboard/journal`)
- **Purpose**: View and manage historical entries
- **Components**:
  - `MomentCard`: Display individual moments
  - `JournalHeader`: Filtering and search
  - Data table with sorting/filtering
- **Features**:
  - Chronological view of all captured moments
  - Search and filter by type, date, emotions
  - Edit/delete existing entries

#### **Soulspace** (`/dashboard/soulspace`)
- **Purpose**: AI-powered contextual chat interface
- **Components**:
  - `SoulspaceChat`: Full-page chat interface
  - Vector-enhanced responses
- **Features**:
  - Semantic search across user's history
  - Pattern recognition
  - Contextual insights and suggestions

### 2.2 Supporting Features

#### **Authentication System**
- Firebase Auth integration
- Email/password authentication
- OAuth providers (Google, Meta)
- Email verification flow
- Password reset functionality
- Session persistence options

#### **Landing & Marketing**
- Public landing page with sections:
  - Hero, Features, How It Works
  - Use Cases, Pricing, FAQ
- Responsive design with animations

## 3. Data & State Flow

### 3.1 Data Models

#### **Moment** (Unified data structure)
```typescript
interface Moment {
  id?: string;
  userId: string;
  type: 'journal' | 'emotion' | 'voice' | 'photo' | 'video' | 'chat';
  title?: string;
  content: string;
  timestamp: Timestamp;
  
  // Emotional context
  mood?: number;           // 0-6 scale
  emotions?: string[];     // Selected emotions
  triggers?: string[];     // What caused this moment
  intensity?: number;      // 1-10 scale
  
  // Media & metadata
  attachments?: string[];  // File URLs
  tags?: string[];
  location?: string;
  weather?: string;
  
  // Type-specific data
  journalData?: {...}
  emotionData?: {...}
  voiceData?: {...}
  photoData?: {...}
  videoData?: {...}
  chatData?: {...}
}
```

### 3.2 Data Flow Patterns

#### **Capture Flow**
1. User enters data via Log page
2. Data validated and enriched on client
3. Saved to Firestore (moments collection)
4. Async indexing to vector database
5. Optional AI processing for insights

#### **Retrieval Flow**
1. Query from UI component
2. Fetch from Firestore or vector search
3. Client-side caching/optimization
4. Display with real-time updates

#### **AI Enhancement Flow**
1. User query triggers AI request
2. Vector search for relevant context
3. Gemini API generates response
4. Response enhanced with patterns/insights
5. Optional persistence as chat moment

### 3.3 State Management

- **Auth State**: React Context (`AuthContext`)
- **Local State**: Component-level useState/useReducer
- **Form State**: React Hook Form
- **Server State**: Direct Firestore queries
- **Cache**: Browser localStorage for drafts

## 4. Critical User Flows

### 4.1 **Main Journaling Flow** (MUST NOT BREAK)
1. User navigates to `/dashboard/log`
2. Selects capture mode (text/video)
3. Enters content with optional attachments
4. Adds emotions/mood if desired
5. Auto-saves to Firestore
6. Receives AI reflection (optional)
7. Content indexed for vector search

### 4.2 **AI Interaction Flow** (MUST NOT BREAK)
1. User opens Soulspace or FloatingChat
2. Enters query/prompt
3. System performs vector search
4. Gemini processes with context
5. Streaming response displayed
6. Conversation persisted

### 4.3 **Auth/Login/Signup Flow** (MUST NOT BREAK)
1. User visits `/login`
2. Enters credentials or OAuth
3. Email verification if new user
4. Redirect to dashboard
5. Session persisted
6. Protected routes enforced

### 4.4 **Data View/Search Flow**
1. User visits `/dashboard/journal`
2. Data fetched from Firestore
3. Displayed in sortable table
4. Search/filter applied
5. Click to view/edit details

## 5. Technical Elements

### 5.1 Core Services

#### **Database Services**
- `dbHelpers.ts`: Legacy CRUD operations
- `moments.ts`: Unified moment operations
- `momentClient.ts`: Client-side moment management
- `moments-server.ts`: Server-side operations

#### **AI/Vector Services**
- `momentVectorService.ts`: Vector indexing for moments
- `vectorDbChroma.ts`: ChromaDB integration
- `enhancedAi.ts`: Enhanced AI responses
- `reflectionService.ts`: AI-powered reflections
- `embeddingService.ts`: Text embedding generation
- `transcriptionService.ts`: Audio/video transcription

#### **Auth Services**
- `AuthContext.tsx`: Authentication context/provider
- `firebaseServerAuth.ts`: Server-side auth
- `authApiClient.ts`: Auth API client

### 5.2 Key Components

#### **Editor Components**
- `BlockEditor`: TipTap-based rich text
- `SimpleTextEditor`: Basic text input
- `VideoRecorder`: Video capture
- `audio_input`: Audio recording

#### **UI Components**
- `app-sidebar`: Main navigation
- `FloatingChatPane`: Inline AI chat
- `EmotionDialogControlled`: Emotion capture
- `ItemCarousel`: Photo gallery
- `AttachmentPanel`: Media attachments

#### **Data Components**
- `MomentCard`: Moment display
- `MomentsList`: Moment collection
- `data-table`: Sortable/filterable table
- `JournalHeader`: Filter controls

### 5.3 Custom Hooks
- `useAuth`: Authentication state
- `useAttachments`: Attachment management
- `useTiptapEditor`: Text editor state
- `useMobile`: Responsive detection
- `useDebounedCallback`: Debounce utility

### 5.4 API Routes

#### **AI Endpoints**
- `POST /api/ai/enhanced-chat`: Vector-enhanced AI chat
- `POST /api/ai/index-user-data`: Index user data to vectors
- `POST /api/ai/reindex-user-data`: Reindex all user data

#### **Moments Endpoints**
- `GET/POST /api/moments`: CRUD operations
- `GET /api/moments/[id]`: Single moment
- `POST /api/moments/search`: Vector search

#### **Data Sync**
- `POST /api/data-sync/migrate`: Migrate legacy data

## 6. Infrastructure & Configuration

### 6.1 Environment Variables
```
NEXT_PUBLIC_FIREBASE_*    # Firebase config
GEMINI_API_KEY           # Google Gemini
PINECONE_API_KEY         # Vector database
OPENAI_API_KEY           # OpenAI services
```

### 6.2 Build & Deploy
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Production**: Vercel deployment ready

### 6.3 Security Considerations
- Firebase Auth for authentication
- Row-level security via userId checks
- API routes protected with auth verification
- Sensitive keys in environment variables
- CORS and rate limiting via Firebase

## 7. Migration & Compatibility

### 7.1 Data Migration
- Legacy collections still supported:
  - `users/{uid}/emotionLogs`
  - `users/{uid}/journalEntries`
- Migration to unified `moments` collection
- Backward compatibility maintained

### 7.2 Vector Database Migration
- Support for both Pinecone and ChromaDB
- Async indexing with retry logic
- Incremental indexing capabilities

## 8. Performance Optimizations

- **Code Splitting**: Dynamic imports for heavy components
- **Lazy Loading**: Images and media content
- **Caching**: LocalStorage for drafts
- **Streaming**: AI responses streamed for UX
- **Debouncing**: Auto-save and search inputs
- **Virtual Scrolling**: Large lists (future)

## 9. Future Enhancements (Planned)

- ML-powered video/image captioning
- Voice note transcription
- Advanced analytics dashboard
- Collaborative features
- Mobile app development
- Offline-first architecture
- Enhanced security with WebAuthn

## 10. Summary

SoulSpect's architecture is designed around a single, powerful principle: **one unified interface for capturing all life moments**, enhanced by AI for deep contextual insights. The system maintains clear separation between data capture (Log page), historical viewing (Journal), and AI interaction (Soulspace), while keeping the vector database as the intelligence backbone that connects everything together.

The architecture prioritizes:
1. **Simplicity**: Single entry point for users
2. **Intelligence**: Vector search and AI enhancement
3. **Flexibility**: Multiple capture modalities
4. **Reliability**: Firebase infrastructure
5. **Scalability**: Modular service architecture

Critical paths that must remain stable:
- Main journaling/capture flow
- AI chat and insights generation
- Authentication and authorization
- Data persistence and retrieval