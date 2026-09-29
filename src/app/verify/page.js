import React from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import VerifyDocument from '@/components/verify/VerifyDocument';

export default function PublicVerifyPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 flex flex-col">
      {/* Standalone Header */}
      <header className="w-full bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 text-slate-900 font-semibold hover:text-indigo-600 transition-colors">
            <Image src="/image.png" alt="SRM Logo" width={28} height={28} className="object-contain" />
            SRM DGV
          </a>
          <div className="flex gap-4">
            <a href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">Home</a>
            <a href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Access Portal</a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <VerifyDocument isPublic={true} />
      </main>
    </div>
  );
}
