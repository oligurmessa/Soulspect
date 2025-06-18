# soulspect

**Effortless emotion logging meets AI-powered growth.**

soulspect is a modern web application built with Next.js that helps users track their emotions, reflect on their thoughts, and discover patterns that drive personal growth through AI-powered insights.

## 🌟 Features

- **Beautiful Landing Page**: Animated coming soon page with smooth transitions
- **Firebase Authentication**: Complete user authentication system with email/password and Google sign-in
- **Protected Routes**: Secure dashboard and user areas
- **Email Actions**: Handle email verification and password resets
- **Responsive Design**: Fully responsive design that works on all devices
- **Modern UI**: Clean, minimalist design with smooth animations using Framer Motion
- **TypeScript**: Fully typed for better development experience

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soulspect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password and Google providers
   - Copy your Firebase configuration

4. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Firebase configuration:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key_here"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
   ```

5. **Configure Firebase Email Actions**
   - In Firebase Console, go to Authentication > Templates
   - For both Password Reset and Email Verification templates:
     - Click the edit icon
     - Click "Customize action URL"
     - Enter: `http://localhost:3000/auth/handle` (or your production domain)
     - Save the changes

6. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
soulspect/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (protected)/        # Protected routes group
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   └── layout.tsx      # Protected layout
│   │   ├── auth/
│   │   │   └── handle/         # Email action handler
│   │   ├── login/              # Login page
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── components/             # Reusable components
│   │   ├── AnimatedLandingContent.tsx
│   │   └── LoadingSpinner.tsx
│   ├── context/                # React contexts
│   │   └── AuthContext.tsx     # Authentication context
│   └── lib/                    # Utilities and configurations
│       └── firebase.ts         # Firebase configuration
├── .env.local.example          # Environment variables template
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🔐 Authentication Features

### Email/Password Authentication
- User registration with email verification
- Secure login with error handling
- Password reset functionality
- Form validation and user feedback

### Google Authentication
- One-click Google sign-in
- Automatic account creation
- Secure OAuth flow

### Protected Routes
- Automatic redirection for unauthenticated users
- Loading states during authentication checks
- Persistent login sessions

### Email Actions
- Email verification handling
- Password reset confirmation
- Recovery email processing
- User-friendly error messages

## 🎨 Design System

### Colors
- **Brand White**: `#F2F2F2` - Primary background
- **Brand Black**: `#000000` - Primary text and UI elements

### Typography
- **Font**: Inter (Google Fonts)
- Clean, modern typography hierarchy
- Responsive text scaling

### Components
- Consistent button styles (`btn-primary`, `btn-secondary`)
- Standardized input fields (`input-field`)
- Reusable card components (`card`)
- Error and success message styling

## 🚦 Getting Started Guide

### For Development

1. **Set up your development environment**
   - Install the recommended VS Code extensions for better DX
   - Enable TypeScript and ESLint for code quality

2. **Understanding the structure**
   - `src/app/` contains all pages using the App Router
   - `(protected)` is a route group that applies authentication
   - Components are organized by functionality

3. **Adding new features**
   - Create new pages in appropriate directories
   - Use the existing authentication context
   - Follow the established design patterns

### For Production

1. **Deploy to Vercel** (recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Update Firebase configuration**
   - Add your production domain to Firebase Auth settings
   - Update the action URL in email templates
   - Configure environment variables in your hosting platform

3. **Environment variables**
   - Set all required environment variables in your hosting platform
   - Ensure Firebase configuration is correct for production

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📚 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore (ready for future features)
- **Animations**: Framer Motion
- **Deployment**: Vercel (recommended)

## 🔮 Future Features

The current version includes the authentication foundation. Planned features include:

- **Emotion Logging**: Daily mood and emotion tracking
- **AI Insights**: Pattern recognition and personalized insights
- **Growth Tracking**: Visual progress and goal setting
- **Data Export**: Export user data in various formats
- **Social Features**: Share insights with trusted contacts
- **Mobile App**: React Native companion app

## 🐛 Troubleshooting

### Common Issues

1. **Firebase connection errors**
   - Verify all environment variables are set correctly
   - Check Firebase project configuration
   - Ensure authentication providers are enabled

2. **Build errors**
   - Run `npm run build` to check for TypeScript errors
   - Verify all imports are correct
   - Check for missing dependencies

3. **Authentication not working**
   - Verify Firebase configuration in console
   - Check browser console for errors
   - Ensure action URLs are configured correctly

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Ensure all environment variables are set
4. Check the GitHub issues for similar problems

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication powered by [Firebase](https://firebase.google.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**soulspect** - Transform your daily emotional experiences into meaningful insights.