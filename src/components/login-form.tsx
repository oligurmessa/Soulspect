"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  AuthError
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"

interface LoginFormProps {
  className?: string
}

type AuthMode = 'signin' | 'signup' | 'reset'

export function LoginForm({ className }: LoginFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [mode, setMode] = React.useState<AuthMode>('signin')
  const [error, setError] = React.useState<string | null>(null)
  
  const router = useRouter()
  const { user } = useAuth()

  React.useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const getErrorMessage = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Invalid email or password'
      case 'auth/wrong-password':
        return 'Invalid email or password'
      case 'auth/email-already-in-use':
        return 'Account already exists with this email'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters'
      case 'auth/invalid-email':
        return 'Please enter a valid email address'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection'
      default:
        return 'Something went wrong. Please try again'
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password)
        toast.success('Welcome back!')
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password)
        toast.success('Welcome to soulspect!')
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim())
        toast.success('Reset link sent to your email')
        setMode('signin')
        return
      }
      
      router.push('/dashboard')
    } catch (err) {
      const error = err as AuthError
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsLoading(true)
    
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      await signInWithPopup(auth, provider)
      toast.success('Welcome!')
      router.push('/dashboard')
    } catch (err) {
      const error = err as AuthError
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    if (newMode !== 'signup') {
      setConfirmPassword("")
    }
  }

  if (user) {
    return null
  }

  const isSignIn = mode === 'signin'
  const isSignUp = mode === 'signup'
  const isReset = mode === 'reset'

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn("w-full max-w-md relative z-10", className)}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <motion.div 
              className="flex items-center justify-center gap-3 group"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg">
                </div>
              </div>
              <h1 className="text-3xl font-bold text-transparent">
                soulspect
              </h1>
            </motion.div>
          </Link>
          
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-semibold text-white">
              {isReset ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-slate-400">
              {isReset 
                ? 'Enter your email to receive a reset link'
                : isSignUp 
                  ? 'Start your journey of self-discovery'
                  : 'Continue your journey within'
              }
            </p>
          </motion.div>
        </div>

        {/* Main Form */}
        <motion.div
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all duration-200"
                autoComplete="email"
                required
              />
            </div>

            {/* Password Field */}
            {!isReset && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white/80">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all duration-200"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={6}
                  required
                />
              </div>
            )}

            {/* Confirm Password Field */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-white/80">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all duration-200"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Icons.spinner className="w-4 h-4 animate-spin" />
              ) : (
                <span>
                  {isReset ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          {!isReset && (
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-4 text-xs text-white/40 uppercase tracking-wider">or</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
          )}

          {/* Google Sign In */}
          {!isReset && (
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              {isLoading ? (
                <Icons.spinner className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Icons.google className="w-4 h-4 mr-2" />
              )}
              Continue with Google
            </Button>
          )}

          {/* Mode Switching */}
          <div className="mt-6 space-y-2 text-center">
            {isReset ? (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                disabled={isLoading}
                className="text-sm text-white/60 hover:text-white/80 transition-colors duration-200"
              >
                Back to sign in
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                  disabled={isLoading}
                  className="text-sm text-white/60 hover:text-white/80 transition-colors duration-200"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </button>
                {isSignIn && (
                  <div>
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      disabled={isLoading}
                      className="text-sm text-white/50 hover:text-white/70 transition-colors duration-200"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}