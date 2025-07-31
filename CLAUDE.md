# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a Next.js 15 application for emotion logging and tracking called "soulspect". The app uses React 19 with TypeScript and follows the App Router pattern.

### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Functions)
- **AI Integration**: Google Gemini API for content generation
- **UI Components**: Radix UI components with shadcn/ui styling
- **Styling**: TailwindCSS with custom themes and animations

### Application Structure

#### Route Organization
- `/app/(protected)/dashboard/` - Main dashboard with protected routes
- `/app/auth/` - Authentication pages
- `/app/login/` - Login page
- Route groups use `(protected)` for authenticated areas

#### Core Components
- `AuthProvider` - Firebase authentication context
- `app-sidebar.tsx` - Main navigation sidebar with Material Symbols icons
- `EmotionLogDrawer.tsx` - Emotion logging interface
- `EmotionsVisualizer.tsx` - Data visualization components
- `ui/` directory - shadcn/ui components

#### Data & State Management
- Firebase Firestore for data persistence
- Firebase Auth for user authentication
- Context API for auth state management
- Environment variables for Firebase and Gemini API keys

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

### Key Features
- Emotion tracking and logging
- AI-powered insights using Gemini
- Data visualization with Recharts
- Real-time data sync with Firestore
- Responsive design with mobile support
- Analytics (Self-Discovery)
- Soulspace (Inner Transformation) Three main features: Explore Subconscious. Release & Reset. Make a Decision.


### Development Notes
- Uses pnpm/npm for package management
- TypeScript strict mode enabled
- ESLint configured for Next.js
- Custom hooks in `/src/hooks/` directory
- Utility functions in `/src/lib/utils.ts`