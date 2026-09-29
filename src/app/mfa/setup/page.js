"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import Image from 'next/image';

export default function MFASetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [fetchingSetup, setFetchingSetup] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchSetup() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/mfa/setup', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setQrCodeUrl(data.qrCodeUrl);
          setSecret(data.secret);
        } else {
          setError('Failed to initialize MFA setup.');
        }
      } catch (err) {
        setError('Network error initializing MFA.');
      } finally {
        setFetchingSetup(false);
      }
    }
    fetchSetup();
  }, [user]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secret, code })
      });

      if (res.ok) {
        // MFA Setup complete! Redirect to dashboard or appropriate role page
        router.push('/department'); // A common entry point, middleware handles the rest
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading || fetchingSetup) {
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
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Secure Your Account</CardTitle>
          <CardDescription className="text-slate-500">
            Two-factor authentication is required for SRM Digital Verification platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            <div className="flex flex-col items-center justify-center space-y-4 p-4 bg-white border rounded-lg">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Smartphone className="h-4 w-4" />
                <span>1. Scan this QR Code</span>
              </div>
              <p className="text-xs text-slate-500 text-center max-w-[250px]">
                Open Google Authenticator or your preferred 2FA app and scan this image.
              </p>
              {qrCodeUrl ? (
                <div className="p-2 bg-white rounded-md shadow-sm border">
                  <Image src={qrCodeUrl} alt="MFA QR Code" width={180} height={180} />
                </div>
              ) : (
                <div className="h-[180px] w-[180px] bg-slate-100 rounded-md animate-pulse"></div>
              )}
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span>2. Enter the 6-digit code</span>
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest h-14 font-mono bg-slate-50"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium"
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
