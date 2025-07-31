"use client";

import { useState } from "react";
import { useLock } from "@/context/LockContext";
import LockDialog from "./LockDialog";
import { Lock, Shield } from "lucide-react";
import { Button } from "./ui/button";

export default function AppLockScreen() {
  const { isLocked, hasPassword, loading } = useLock();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLocked) {
    return null; // App is unlocked, show normal content
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                {hasPassword ? (
                  <Lock className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
                ) : (
                  <Shield className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
                {hasPassword ? "Soulspect is Locked" : "Secure Your Data"}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {hasPassword 
                  ? "Enter your password to access your personal data and continue your self-discovery journey."
                  : "Set a password to protect your sensitive emotional data and journal entries."
                }
              </p>
            </div>

            <Button
              onClick={() => setDialogOpen(true)}
              className="w-full h-12 text-base"
            >
              {hasPassword ? "Unlock App" : "Set Password"}
            </Button>

            {hasPassword && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                Your data is encrypted and secure
              </p>
            )}
          </div>
        </div>
      </div>

      <LockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={hasPassword ? "unlock" : "set"}
      />
    </>
  );
}