"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, RefreshCcw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { user, sendVerificationEmail, logout } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // If email is already verified, redirect to dashboard
    if (user.emailVerified) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleResendEmail = async () => {
    setSending(true);
    try {
      await sendVerificationEmail();
      toast.success("Verification email sent! Please check your inbox and spam folder.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification email");
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    
    setCheckingVerification(true);
    try {
      // Force refresh the user's auth state
      await user.reload();
      
      if (user.emailVerified) {
        toast.success("Email verified successfully!");
        router.push("/dashboard");
      } else {
        toast.error("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (error) {
      toast.error("Failed to check verification status");
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </div>

        <Card className="border-0 shadow-2xl bg-white dark:bg-zinc-900">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-semibold">Verify Your Email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to <strong>{user.email}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Next steps:</strong>
              </p>
              <ol className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here and click "I've Verified My Email"</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCheckVerification}
                disabled={checkingVerification}
                className="w-full"
              >
                {checkingVerification ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    I've Verified My Email
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={sending}
                className="w-full"
              >
                {sending ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-center space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Wrong email address?
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  Sign out and try again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Having trouble? The verification email might take a few minutes to arrive.
            <br />
            Make sure to check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}