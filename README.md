# Soulspect

An emotion tracking and self-discovery application built with Next.js 15, Firebase, and AI-powered insights.

## Features

- **Emotion Logging**: Track your daily emotions with mood scale and emotion selection
- **Journal**: Text, voice, and video journaling with AI-powered prompts
- **Analytics**: Visualize emotional patterns and trends
- **Soulspace**: Tools for inner transformation including:
  - Explore Subconscious
  - Release & Reset
  - Make a Decision
- **Settings**: Comprehensive settings with theme, language, and preference customization

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI**: Google Gemini API for content generation
- **UI**: Radix UI with shadcn/ui components
- **Styling**: TailwindCSS with custom themes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Firebase project
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/soulspect.git
cd soulspect
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Firebase and Gemini API credentials

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase Hosting:
```bash
firebase init hosting
```

3. Build and deploy:
```bash
npm run build
firebase deploy --only hosting
```

## Security

- Firebase security rules are configured for user data isolation
- All user data is private and accessible only to the authenticated user
- Firestore rules validate data structure and types
- Authentication is required for all app features

## Environment Variables

Required environment variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Admin SDK
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PROJECT_ID

# Gemini API
GEMINI_API_KEY
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

© 2025 Soulspect. All rights reserved.