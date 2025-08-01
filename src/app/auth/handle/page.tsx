"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthHandleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const continueUrl = searchParams.get('continueUrl');
    const apiKey = searchParams.get('apiKey');
    const lang = searchParams.get('lang');

    if (mode === 'resetPassword' && oobCode) {
      // For password reset, go directly to reset password page
      router.replace(`/reset-password?oobCode=${oobCode}&continueUrl=${continueUrl || ''}`);
      return;
    }

    // For other modes, redirect to action handler
    const params = new URLSearchParams();
    if (mode) params.set('mode', mode);
    if (oobCode) params.set('oobCode', oobCode);
    if (continueUrl) params.set('continueUrl', continueUrl);
    if (apiKey) params.set('apiKey', apiKey);
    if (lang) params.set('lang', lang);

    router.replace(`/auth/action?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Redirecting...</p>
      </div>
    </div>
  );
}

export default function AuthHandlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    }>
      <AuthHandleContent />
    </Suspense>
  );
}