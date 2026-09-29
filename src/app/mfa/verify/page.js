"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, LockKeyhole } from 'lucide-react';

export default function MFAVerifyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      if (res.ok) {
        // MFA Verification complete! Redirect to dashboard or appropriate role page
        const { role } = await user.getIdTokenResult().then(res => res.claims);
        if (role === 'SUPER_ADMIN') router.push('/admin');
        else if (role === 'SIGNATORY') router.push('/signatory');
        else if (role === 'STUDENT') router.push('/student');
        else router.push('/department');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid code. Please try again.');
        setCode('');
        if (inputRef.current) inputRef.current.focus();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-slate-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
            <LockKeyhole className="h-6 w-6 text-slate-700" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-slate-500">
            Open your authenticator app to view your verification code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="000 000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-3xl tracking-[0.5em] h-16 font-mono bg-white shadow-sm"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
              disabled={isVerifying || code.length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
