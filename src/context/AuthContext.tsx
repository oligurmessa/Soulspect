// src/components/AuthContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUser, getUser, updateUser } from "@/lib/data/legacy/dbHelpers";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMeta: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  setPersistenceMode: (persist: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  logout: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithMeta: async () => {},
  resetPassword: async () => {},
  sendVerificationEmail: async () => {},
  updateUserProfile: async () => {},
  setPersistenceMode: async () => {}
});

// Auth providers
const googleProvider = new GoogleAuthProvider();
const metaProvider = new FacebookAuthProvider();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user exists in Firestore, if not create them
        try {
          const existingUser = await getUser(user.uid);
          if (!existingUser) {
            await createUser({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              preferences: {
                theme: 'system',
                notifications: true,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            });
          }
        } catch (error) {
          console.error('Error creating user in Firestore:', error);
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        // Send verification email if not verified
        await sendEmailVerification(result.user);
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign in");
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // Create user account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, { displayName });
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      // Create user in Firestore
      await createUser({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: displayName,
        photoURL: '',
        preferences: {
          theme: 'system',
          notifications: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to create account");
    }
  };

  const signInWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      // User creation in Firestore is handled by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || "Google sign-in failed");
    }
  };

  const signInWithMeta = async () => {
    try {
      const result = await signInWithPopup(auth, metaProvider);
      // User creation in Firestore is handled by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || "Meta sign-in failed");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || "Failed to send reset email");
    }
  };

  const sendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch (error: any) {
        throw new Error(error.message || "Failed to send verification email");
      }
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (user) {
      try {
        const updates: any = { displayName };
        if (photoURL) updates.photoURL = photoURL;
        
        await updateProfile(user, updates);
        
        // Update Firestore as well
        await updateUser(user.uid, updates);
      } catch (error: any) {
        throw new Error(error.message || "Failed to update profile");
      }
    }
  };

  const setPersistenceMode = async (persist: boolean) => {
    try {
      await setPersistence(auth, persist ? browserLocalPersistence : browserSessionPersistence);
    } catch (error: any) {
      throw new Error(error.message || "Failed to set persistence");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    loading,
    logout,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithMeta,
    resetPassword,
    sendVerificationEmail,
    updateUserProfile,
    setPersistenceMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};