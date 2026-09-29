"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { env } from '@/config/env';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, KeyRound, Loader2, X } from 'lucide-react';
import { updatePassword, getRedirectResult, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  
  const { user, login, loginWithGoogle, logout } = useAuth();
  const router = useRouter();

  const handleRouteByRole = (userRole) => {
    if (userRole === 'SUPER_ADMIN') router.push('/admin');
    else if (userRole === 'DEPARTMENT_USER') router.push('/department');
    else if (userRole === 'SIGNATORY') router.push('/signatory');
    else throw new Error("Unauthorized role");
  };

  const checkMFAAndRoute = async (currentUser, userRole) => {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/mfa/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mfaEnabled) {
          router.push('/mfa/verify');
        } else {
          router.push('/mfa/setup');
        }
      } else {
        throw new Error('Failed to check MFA status');
      }
    } catch (err) {
      setError('Error checking security requirements. Please try again.');
      setLoading(false);
      setResetLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user: loggedInUser, role, requiresReset } = await login(email, password);
      if (requiresReset) {
        setPendingRole(role);
        setShowResetModal(true);
      } else {
        await checkMFAAndRoute(loggedInUser, role);
      }
    } catch (err) {
      if (err.message === "UNAUTHORIZED_ACCOUNT") {
        setError('Unauthorized: Your account has not been provisioned by an administrator.');
      } else {
        setError('Invalid credentials or unauthorized access.');
      }
      console.error(err);
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Execute login IMMEDIATELY using raw promises.
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    signInWithPopup(auth, provider)
      .then(async (userCredential) => {
        setLoading(true);
        setError('');
        
        try {
          const { user: loggedInUser, role, requiresReset } = await loginWithGoogle(userCredential);
          if (requiresReset) {
            setPendingRole(role);
            setShowResetModal(true);
          } else {
            await checkMFAAndRoute(loggedInUser, role);
          }
        } catch (err) {
          setLoading(false);
          if (err.message === "UNAUTHORIZED_ACCOUNT") {
            setError('Unauthorized: Your account has not been provisioned by an administrator.');
          } else {
            setError('Failed to log in with Google. Please try again.');
          }
          console.error(err);
        }
      })
      .catch((err) => {
        setLoading(false);
        if (err.code === 'auth/popup-blocked') {
          setError('Popup blocked! Please check your adblocker or click "Allow popups".');
        } else if (err.code === 'auth/account-exists-with-different-credential') {
          setError('An account already exists with this email. Please sign in with your Email and Password.');
        } else {
          setError('Failed to log in with Google. Please try again.');
        }
        console.error('Google Login Error:', err);
      });
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setResetError('Passwords do not match');
    }
    if (newPassword.length < 8) {
      return setResetError('Password must be at least 8 characters long');
    }

    setResetLoading(true);
    setResetError('');

    try {
      // Securely update password directly with Firebase Client SDK
      await updatePassword(user, newPassword);

      // Ping our backend to remove the cryptographic requiresPasswordReset claim
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/clear-reset-claim', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to verify password update. Please contact support.');
      }

      // Force token refresh to apply the removed claim locally
      await user.getIdToken(true);
      
      // Successfully updated, proceed to portal
      setShowResetModal(false);
      await checkMFAAndRoute(user, pendingRole);
    } catch (err) {
      setResetError(err.message || 'An error occurred while updating your password.');
    } finally {
      setResetLoading(false);
    }
  };

  const cancelPasswordReset = async () => {
    await logout();
    setShowResetModal(false);
    setPendingRole(null);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        
        <div className="w-full max-w-[400px]">
          
          <div className="mb-10 flex flex-col items-center text-center">
            <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-xl mb-8 hover:opacity-90 transition-opacity">
              <Image src="/image.png" alt="SRM Logo" width={36} height={36} className="object-contain" />
              <span>SRM</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to your institutional account</p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-[4px] shadow-sm p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-[2px]">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700" htmlFor="email">Email address</label>
                <input 
                  id="email" 
                  type="email" 
                  className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-[2px] focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-sm transition-shadow"
                  placeholder="name@srmist.edu.in" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700" htmlFor="password">Password</label>
                <input 
                  id="password" 
                  type="password" 
                  className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-[2px] focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-sm transition-shadow"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-10 mt-4 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-zinc-500">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-10 flex items-center justify-center bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-sm font-medium rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>

        </div>

      </div>

      {/* Force Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Security Action Required
              </h2>
              <button 
                onClick={cancelPasswordReset}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-zinc-600 mb-6">
                You are logging in with a temporary or administratively reset password. For your security, you must create a new permanent password before accessing the system.
              </p>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded text-sm font-medium">
                    {resetError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-zinc-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      className="w-full pl-10 pr-3 py-2 bg-white border border-zinc-200 rounded-[4px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-shadow"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-zinc-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      className="w-full pl-10 pr-3 py-2 bg-white border border-zinc-200 rounded-[4px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-shadow"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 mt-6">
                  <button 
                    type="button" 
                    onClick={cancelPasswordReset}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={resetLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center"
                  >
                    {resetLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
