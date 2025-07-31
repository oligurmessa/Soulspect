"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

type ActionResult = {
  type: 'success' | 'error' | 'loading';
  message: string;
  title: string;
};

function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ActionResult>({
    type: 'loading',
    message: 'Processing your request...',
    title: 'Please wait'
  });

  useEffect(() => {
    const handleAuthAction = async () => {
      const mode = searchParams.get('mode');
      const actionCode = searchParams.get('oobCode');
      const continueUrl = searchParams.get('continueUrl');

      if (!actionCode || !mode) {
        setResult({
          type: 'error',
          title: 'Invalid Link',
          message: 'This verification link is invalid or has expired. Please request a new one.'
        });
        return;
      }

      try {
        switch (mode) {
          case 'verifyEmail':
            await handleEmailVerification(actionCode);
            break;
          case 'resetPassword':
            // Redirect to password reset page with the code
            router.push(`/reset-password?oobCode=${actionCode}&continueUrl=${continueUrl || ''}`);
            break;
          case 'recoverEmail':
            await handleEmailRecovery(actionCode);
            break;
          default:
            setResult({
              type: 'error',
              title: 'Unsupported Action',
              message: 'This type of action is not supported.'
            });
        }
      } catch (error: any) {
        console.error('Auth action error:', error);
        setResult({
          type: 'error',
          title: 'Verification Failed',
          message: error.message || 'Something went wrong. Please try again or request a new verification email.'
        });
      }
    };

    handleAuthAction();
  }, [searchParams, router]);

  const handleEmailVerification = async (actionCode: string) => {
    try {
      // Verify the action code is valid
      await checkActionCode(auth, actionCode);
      
      // Apply the email verification
      await applyActionCode(auth, actionCode);
      
      setResult({
        type: 'success',
        title: 'Email Verified!',
        message: 'Your email has been successfully verified. You can now access all features of Soulspect.'
      });

      // Automatically redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (error: any) {
      let message = 'Verification failed. Please try again.';
      
      if (error.code === 'auth/expired-action-code') {
        message = 'This verification link has expired. Please request a new one.';
      } else if (error.code === 'auth/invalid-action-code') {
        message = 'This verification link is invalid. Please request a new one.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'This account has been disabled.';
      }

      throw new Error(message);
    }
  };

  const handleEmailRecovery = async (actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      setResult({
        type: 'success',
        title: 'Email Recovered',
        message: 'Your email has been successfully recovered.'
      });
    } catch (error: any) {
      throw new Error('Failed to recover email. Please contact support.');
    }
  };

  const getIcon = () => {
    switch (result.type) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'loading':
      default:
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const getActions = () => {
    if (result.type === 'loading') return null;

    return (
      <div className="space-y-3">
        {result.type === 'success' ? (
          <>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Redirecting automatically in 3 seconds...
            </p>
          </>
        ) : (
          <>
            <Button asChild className="w-full">
              <Link href="/verify-email">
                Request New Verification Email
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                Back to Login
              </Link>
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white dark:bg-zinc-900">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getIcon()}
            </div>
            <CardTitle className="text-2xl font-semibold">{result.title}</CardTitle>
            <CardDescription className="text-base">
              {result.message}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {getActions()}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    }>
      <AuthActionContent />
    </Suspense>
  );
}