"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  applyActionCode, 
  confirmPasswordReset, 
  verifyPasswordResetCode,
  AuthError 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type ActionStatus = 'loading' | 'passwordReset' | 'success' | 'error';

function AuthActionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<ActionStatus>('loading');
  const [message, setMessage] = useState('Processing your request...');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');

  const getErrorMessage = (error: AuthError) => {
    switch (error.code) {
      case 'auth/expired-action-code':
        return 'This link has expired. Please request a new one.';
      case 'auth/invalid-action-code':
        return 'This link is invalid. Please check your email for the correct link.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      default:
        return 'An error occurred. Please try again or contact support.';
    }
  };

  useEffect(() => {
    if (!mode || !actionCode) {
      setStatus('error');
      setMessage('Invalid request. Please check your email for the correct link.');
      return;
    }

    const handleAction = async () => {
      try {
        switch (mode) {
          case 'resetPassword':
            // Verify the reset code is valid
            await verifyPasswordResetCode(auth, actionCode);
            setMessage('Please enter your new password below.');
            setStatus('passwordReset');
            break;
            
          case 'verifyEmail':
            await applyActionCode(auth, actionCode);
            setMessage('Your email has been successfully verified! Redirecting to dashboard...');
            setStatus('success');
            setTimeout(() => router.push('/dashboard'), 3000);
            break;
            
          case 'recoverEmail':
            await applyActionCode(auth, actionCode);
            setMessage('Your email has been recovered! Redirecting to login...');
            setStatus('success');
            setTimeout(() => router.push('/login'), 3000);
            break;
            
          default:
            throw new Error('Unsupported action mode.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(getErrorMessage(error as AuthError));
      }
    };

    handleAction();
  }, [mode, actionCode, router]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!actionCode) {
      setMessage('Invalid reset code. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setMessage('Password reset successfully! Redirecting to login...');
      setStatus('success');
      setTimeout(() => router.push('/login'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage(getErrorMessage(error as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-black border-t-transparent mb-4" />
            <p className="text-brand-black/60">{message}</p>
          </div>
        );

      case 'passwordReset':
        return (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-brand-black mb-2">
                Reset Your Password
              </h2>
              <p className="text-brand-black/60 text-sm">{message}</p>
            </div>
            
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-brand-black mb-2">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="input-field"
                required
                minLength={6}
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-black mb-2">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="input-field"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        );

      case 'success':
        return (
          <div className="text-center">

          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-green-600 text-3xl">
              check_circle
            </span>
          </div>

            <h2 className="text-xl font-semibold text-brand-black mb-2">
              Success!
            </h2>
            <p className="text-green-600 mb-4">{message}</p>
            <div className="text-sm text-brand-black/60">
              If you are not redirected automatically, 
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-brand-black hover:underline ml-1"
              >
                click here
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span
                className="material-symbols-outlined text-red-600"
                style={{ fontSize: '2.5rem', lineHeight: 1 }}
              >
                cancel
              </span>
            </div>

            <h2 className="text-xl font-semibold text-brand-black mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600 mb-6">{message}</p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/login')}
                className="btn-primary w-full"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-secondary w-full"
              >
                Go to Home
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-white to-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-black mb-2">
            soulspect
          </h1>
          <p className="text-brand-black/60">
            Account Action
          </p>
        </div>

        {/* Content Card */}
        <motion.div
          className="card"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-brand-black/40">
            Need help? Contact our support team.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthActionHandler />
    </Suspense>
  );
}