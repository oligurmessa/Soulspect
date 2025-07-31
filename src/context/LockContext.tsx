"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getUser, updateUser } from "@/lib/dbHelpers";

interface LockContextType {
  isLocked: boolean;
  hasPassword: boolean;
  lockFeatureEnabled: boolean;
  setPassword: (password: string) => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  lock: () => void;
  unlock: () => void;
  loading: boolean;
}

const LockContext = createContext<LockContextType>({
  isLocked: true,
  hasPassword: false,
  lockFeatureEnabled: false,
  setPassword: async () => {},
  verifyPassword: async () => false,
  lock: () => {},
  unlock: () => {},
  loading: true,
});

// Simple hash function for password storage (in production, use proper encryption)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const LockProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [lockFeatureEnabled, setLockFeatureEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storedPasswordHash, setStoredPasswordHash] = useState<string | null>(null);

  // Load lock settings from user preferences
  useEffect(() => {
    const loadLockSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getUser(user.uid);
        const appPassword = userData?.preferences?.appPassword;
        const lockEnabled = userData?.preferences?.lockFeatureEnabled ?? false;
        
        setLockFeatureEnabled(lockEnabled);
        
        if (lockEnabled && appPassword) {
          setHasPassword(true);
          setStoredPasswordHash(appPassword);
          // Check if user was previously unlocked in this session
          const sessionUnlocked = sessionStorage.getItem(`soulspect_unlocked_${user.uid}`);
          setIsLocked(!sessionUnlocked);
        } else {
          setHasPassword(false);
          setIsLocked(false); // No password set or feature disabled, so app is unlocked
        }
      } catch (error) {
        console.error("Error loading lock settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLockSettings();
  }, [user]);

  const setPassword = async (password: string) => {
    if (!user) return;

    try {
      const hashedPassword = await hashPassword(password);
      
      await updateUser(user.uid, {
        preferences: {
          ...((await getUser(user.uid))?.preferences || {}),
          appPassword: hashedPassword,
        },
      });

      setStoredPasswordHash(hashedPassword);
      setHasPassword(true);
      setIsLocked(false);
      
      // Store unlock state in session
      sessionStorage.setItem(`soulspect_unlocked_${user.uid}`, 'true');
    } catch (error) {
      console.error("Error setting password:", error);
      throw error;
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!storedPasswordHash) return false;

    try {
      const hashedPassword = await hashPassword(password);
      return hashedPassword === storedPasswordHash;
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  };

  const lock = () => {
    setIsLocked(true);
    if (user) {
      sessionStorage.removeItem(`soulspect_unlocked_${user.uid}`);
    }
  };

  const unlock = () => {
    setIsLocked(false);
    if (user) {
      sessionStorage.setItem(`soulspect_unlocked_${user.uid}`, 'true');
    }
  };

  const value: LockContextType = {
    isLocked,
    hasPassword,
    lockFeatureEnabled,
    setPassword,
    verifyPassword,
    lock,
    unlock,
    loading,
  };

  return (
    <LockContext.Provider value={value}>
      {children}
    </LockContext.Provider>
  );
};

export const useLock = () => {
  const context = useContext(LockContext);
  if (context === undefined) {
    throw new Error('useLock must be used within a LockProvider');
  }
  return context;
};