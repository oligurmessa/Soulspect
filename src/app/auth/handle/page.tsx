"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthHandleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    // Get all search parameters
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const continueUrl = searchParams.get('continueUrl');
    const apiKey = searchParams.get('apiKey');
    const lang = searchParams.get('lang');

    setStatus(`Processing ${mode} request...`);
    console.log('Handle page - Mode:', mode, 'Code:', oobCode?.substring(0, 10) + '...');

    // Add a small delay to show the status
    setTimeout(() => {
      if (mode === 'resetPassword' && oobCode) {
        // For password reset, go directly to reset password page
        setStatus('Redirecting to password reset page...');
        console.log('Redirecting directly to reset-password page');
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

      const redirectUrl = `/auth/action?${params.toString()}`;
      setStatus('Redirecting to auth handler...');
      console.log('Redirecting to action handler:', redirectUrl);
      router.replace(redirectUrl);
    }, 1000);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">{status}</p>
        <p className="text-xs text-zinc-500 mt-2">Mode: {searchParams.get('mode')}</p>
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