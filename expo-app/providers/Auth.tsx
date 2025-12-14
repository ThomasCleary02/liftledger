import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, accountService } from "../lib/firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };
  const signUp = async (email: string, password: string, username?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    // Create account document with username if provided
    if (username && userCredential.user) {
      try {
        await accountService.setUsername(username);
      } catch (error) {
        console.error("Failed to set username during signup", error);
        // Don't throw - account creation succeeded, username can be set later
      }
    }
  };
  const signOutUser = async () => {
    await signOut(auth);
  };

  return <Ctx.Provider value={{ user, loading, signIn, signUp, signOutUser }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}