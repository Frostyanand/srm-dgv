"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function PortalLayout({ children }) {
  const { user, role, requiresReset, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !role) {
        router.push('/login');
      } else if (requiresReset) {
        router.push('/login');
      }
    }
  }, [user, role, requiresReset, loading, router]);

  if (loading || !user || !role || requiresReset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-slate-500">Loading portal...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
