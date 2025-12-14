


"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { accountService } from "../lib/firebase";
import React from "react";
import { logger } from "../lib/logger";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    // This will automatically restore the user session from localStorage
    // and fire whenever the auth state changes
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        if (user) {
          logger.info("User authenticated", { email: user.email });
        } else {
          logger.info("User signed out");
        }
      },
      (error) => {
        logger.error("Auth state change error", error);
        setLoading(false);
      }
    );
    
    return () => unsub();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Auth state will be updated automatically by onAuthStateChanged
      logger.info("Sign in successful");
    } catch (error) {
      logger.error("Sign in failed", error);
      throw error;
    }
  }, []);
  
  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Create account document with username if provided
      if (username && userCredential.user) {
        try {
          await accountService.setUsername(username);
        } catch (error) {
          logger.error("Failed to set username during signup", error);
          // Don't throw - account creation succeeded, username can be set later
        }
      }
      // Auth state will be updated automatically by onAuthStateChanged
      logger.info("Sign up successful");
    } catch (error) {
      logger.error("Sign up failed", error);
      throw error;
    }
  }, []);
  
  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      // Auth state will be updated automatically by onAuthStateChanged
      logger.info("Sign out successful");
    } catch (error) {
      logger.error("Sign out failed", error);
      throw error;
    }
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, signIn, signUp, signOutUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}