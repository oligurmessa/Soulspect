# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## App Intent & Vision

**SoulSpect** is a focused **moment capturing app on steroids** - powered by AI to provide deep, contextual insights from your life experiences. The core philosophy is simple: capture life moments effortlessly, let AI make sense of them intelligently.

### Core Focus
- **Single Entry Point**: Users log everything through ONE page - the log page (`/dashboard/log`)
- **Multimodal Capture**: Text, video, photos, emotions, and voice - all in one unified interface
- **AI-Powered Intelligence**: Vector database + Gemini AI provides contextual insights across all captured moments
- **Smart Processing**: ML image captioning, video transcription, voice-to-text for comprehensive AI understanding

## Architecture Overview

This is a Next.js 15 application for intelligent moment capturing called "soulspect". The app uses React 19 with TypeScript and follows the App Router pattern.

### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Functions)
- **AI Integration**: 
  - Google Gemini API for contextual insights
  - Pinecone Vector Database for semantic search
  - OpenAI for embeddings and transcription
- **UI Components**: Radix UI components with shadcn/ui styling
- **Styling**: TailwindCSS with custom themes and animations

### Application Structure

#### Route Organization
- `/app/(protected)/dashboard/log/` - **PRIMARY**: Single moment capture interface
- `/app/(protected)/dashboard/soulspace/` - AI chat interface for insights
- `/app/(protected)/dashboard/journal/` - Historical data view
- `/app/(protected)/dashboard/analytics/` - Data visualization
- `/app/auth/` - Authentication pages
- `/app/login/` - Login page
- Route groups use `(protected)` for authenticated areas

#### Core Components
- `AuthProvider` - Firebase authentication context
- `actionbar.tsx` - Mode switcher (Type/Video) and attachment tools
- `FloatingChatPane.tsx` - Vector-enhanced AI chat interface  
- `VideoRecorder.tsx` - Video capture component
- `text_editor.tsx` - Rich text entry interface
- `EmotionAnchor.tsx` - Emotion logging overlay
- `ItemCarousel.tsx` - Photo attachment carousel
- `ui/` directory - shadcn/ui components

#### Data & State Management
- Firebase Firestore for data persistence
- Pinecone Vector Database for semantic search
- Firebase Auth for user authentication
- Context API for auth state management
- Environment variables for Firebase, Gemini, Pinecone, and OpenAI API keys

### Firebase Configuration
- Uses Firebase v11.9.1 with Firestore, Auth, and Functions
- Environment variables required: `NEXT_PUBLIC_FIREBASE_*` keys
- Admin SDK configured for server-side operations
- Firestore rules and indexes configured via `firebase.json`

### Styling & Theming
- TailwindCSS with custom design system
- Dark mode support via `next-themes`
- Custom brand colors: `brand-black` (#111111), `brand-white` (#ffffff)
- CSS variables for theme consistency
- Material Symbols icons for navigation

### Data Types Captured (All via Log Page)

The app captures these moment types through a unified interface:

1. **Text Entries** (`JournalEntry`)
   - Title and rich text content
   - Date/time metadata
   - Optional emotion anchors

2. **Video Data** (`JournalEntry` with video attachment)
   - Video recordings from camera
   - Future: ML video captioning for AI processing
   - Stored as Firebase Storage attachments

3. **Photo Data** (`JournalEntry` carousel content)
   - Photo attachments with user captions
   - Future: ML image captioning
   - Carousel-based organization

4. **Emotion Anchor Data** (`EmotionLog`)
   - Mood ratings (1-6 scale)
   - Multiple emotion tags
   - Trigger identification
   - Context and intensity

5. **Voice Notes** (Future)
   - Audio recordings transcribed to text
   - Processed through OpenAI Whisper
   - Indexed in vector database

6. **AI Chat History** (`FloatingChatPane`)
   - Contextual conversations with AI
   - Vector-enhanced responses
   - Pattern recognition across user's history

### Key Features
- **Unified Moment Capture**: Single interface for all data types
- **Vector-Enhanced AI**: Semantic search across all captured moments
- **Contextual Insights**: AI references past entries and identifies patterns
- **Multimodal Processing**: Text, video, photos, emotions, voice in one system
- **Real-time Intelligence**: Immediate AI insights as you capture moments


### Development Notes
- Uses pnpm/npm for package management
- TypeScript strict mode enabled
- ESLint configured for Next.js
- Custom hooks in `/src/hooks/` directory
- Utility functions in `/src/lib/utils.ts`