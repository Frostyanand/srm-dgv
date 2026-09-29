"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [requiresReset, setRequiresReset] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Force token refresh to get latest claims if needed
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        
        // Strict Role Enforcement Defense-in-Depth
        if (!tokenResult.claims.role) {
          // If role is missing, we don't wipe the state immediately because it might be a split-second race condition during auth merges.
          // The actual login functions enforce roles strictly anyway.
          console.warn("User token is missing role claim during onAuthStateChanged.");
        } else {
          const token = await firebaseUser.getIdToken();
          document.cookie = `__session=${token}; path=/; secure; samesite=strict`;
          setUser(firebaseUser);
          setRole(tokenResult.claims.role);
          setRequiresReset(!!tokenResult.claims.requiresPasswordReset);
        }
      } else {
        document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setUser(null);
        setRole(null);
        setRequiresReset(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const tokenResult = await userCredential.user.getIdTokenResult(true);
    
    if (!tokenResult.claims.role) {
      await firebaseSignOut(auth);
      throw new Error("UNAUTHORIZED_ACCOUNT");
    }
    
    // Explicitly set cookie here to prevent race conditions with middleware before routing
    const token = await userCredential.user.getIdToken();
    document.cookie = `__session=${token}; path=/; secure; samesite=strict`;

    // Set state immediately to prevent layout route race conditions
    setUser(userCredential.user);
    setRole(tokenResult.claims.role);
    setRequiresReset(!!tokenResult.claims.requiresPasswordReset);

    return { 
      user: userCredential.user, 
      role: tokenResult.claims.role,
      requiresReset: !!tokenResult.claims.requiresPasswordReset
    };
  };

  const loginWithGoogle = async (userCredential) => {
    const tokenResult = await userCredential.user.getIdTokenResult(true);
    
    if (!tokenResult.claims.role) {
      await firebaseSignOut(auth);
      throw new Error("UNAUTHORIZED_ACCOUNT");
    }
    
    // Explicitly set cookie here to prevent race conditions with middleware before routing
    const token = await userCredential.user.getIdToken();
    document.cookie = `__session=${token}; path=/; secure; samesite=strict`;

    // Set state immediately to prevent layout route race conditions
    setUser(userCredential.user);
    setRole(tokenResult.claims.role);
    setRequiresReset(!!tokenResult.claims.requiresPasswordReset);

    return { 
      user: userCredential.user, 
      role: tokenResult.claims.role,
      requiresReset: !!tokenResult.claims.requiresPasswordReset
    };
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, requiresReset, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
