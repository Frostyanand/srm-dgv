"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Database, 
  Fingerprint, 
  Link as LinkIcon, 
  CheckCircle2,
  FileCheck,
  Server,
  Ghost, 
  Skull, 
  DatabaseZap, 
  UserX, 
  Scissors, 
  ShieldAlert, 
  Zap
} from 'lucide-react';

export default function SecurityInsightsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200">Trust & Transparency Center</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Security Architecture
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            The SRM Digital Verification System isn't just an app—it's an impenetrable digital fortress. 
            We've built this platform with military-grade cryptography to ensure absolute trust, immutability, 
            and transparency for every document that passes through our doors.
          </p>
        </div>
      </div>

      {/* Feature 1: ECDSA Digital Signatures */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Fingerprint className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">1. Elliptic Curve Cryptographic Signatures (ECDSA)</h2>
        </div>
        
        <Card className="overflow-hidden border-0 shadow-lg bg-white">
          <div className="grid md:grid-cols-2">
            <div className="p-8 space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">The Problem with Normal Logins</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                In most systems, if a hacker steals a password, they can log in and click "Approve" on a document. 
                The system can't tell the difference between the hacker and the real Dean.
              </p>
              
              <h3 className="text-lg font-semibold text-slate-800 pt-4">Our Cryptographic Solution</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We assign every signatory a mathematically unique <strong>Private Key</strong> locked deep within their vault. 
                When a document is signed, the system uses advanced Elliptic Curve Math to generate a "Digital Fingerprint." 
                Even if someone hacks the database, they <strong>cannot fake this math</strong>. It provides absolute, undeniable proof that the specific person authorized the document.
              </p>
            </div>
            
            {/* Diagram */}
            <div className="bg-slate-50 p-8 flex flex-col items-center justify-center border-l border-slate-100">
              <div className="flex items-center justify-between w-full max-w-xs mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-full shadow flex items-center justify-center mb-2 text-indigo-600 border border-slate-200">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Document</span>
                </div>
                
                <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-300 to-indigo-300 mx-2 relative">
                  <div className="absolute -top-3 left-1/2 -ml-3 bg-white p-1 rounded-full text-indigo-500">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full shadow flex items-center justify-center mb-2 text-white border-4 border-indigo-200">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-700">Mathematical Proof</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-500 w-full max-w-xs text-center font-mono">
                Signature: 0x3f8a9...b4e2
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Feature 2: Hash Chain Integrity */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <LinkIcon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">2. Immutable HMAC Hash-Chaining (The Ledger)</h2>
        </div>
        
        <Card className="overflow-hidden border-0 shadow-lg bg-white p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Diagram */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm relative">
                <p className="text-xs font-bold text-slate-700">Action 1: Document Uploaded</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Hash: a7f8d9...</p>
              </div>
              <div className="h-6 w-0.5 bg-emerald-400"></div>
              <div className="w-full max-w-xs bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-sm relative">
                <p className="text-xs font-bold text-emerald-800">Action 2: Dean Approved</p>
                <p className="text-[10px] text-emerald-600 font-mono mt-1">Locks previous Hash: a7f8d9...</p>
                <p className="text-[10px] text-slate-500 font-mono">New Hash: c4b2e1...</p>
              </div>
              <div className="h-6 w-0.5 bg-emerald-400"></div>
              <div className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm relative">
                <p className="text-xs font-bold text-slate-700">Action 3: VC Approved</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Locks previous Hash: c4b2e1...</p>
                <p className="text-[10px] text-slate-500 font-mono">New Hash: f9d3a7...</p>
              </div>
            </div>

            <div className="space-y-4 flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-slate-800">Blockchain-Inspired Security</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We don't just save records in a database; we link them together like an unbreakable chain. 
                Every time an event occurs in our system, we generate a unique code (a "Hash") based on what just happened, <strong>plus the Hash of the event that happened right before it.</strong>
              </p>
              
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mt-2">
                <h4 className="text-sm font-bold text-rose-800 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Tamper-Proof Guarantee
                </h4>
                <p className="text-xs text-rose-700">
                  If a corrupt admin tries to go back in time and change "Action 1", its Hash will automatically change. 
                  Because Action 2 was locked using Action 1's old hash, the math breaks instantly. The system detects the break and triggers a massive security alarm.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Feature 3 & 4 Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Encryption at Rest */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">3. AES-256 File Encryption</h2>
          </div>
          
          <Card className="h-[280px] border-0 shadow-lg bg-white p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-md font-semibold text-slate-800">Military-Grade Data Vault</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                When a document is uploaded, it isn't just saved to a hard drive. It is encrypted using AES-256, the exact same encryption standard used by the U.S. government to protect Top Secret information.
              </p>
              <ul className="space-y-3 mt-4">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>If someone physically steals the server hard drives, the files are completely unreadable gibberish.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Files are securely decrypted in memory only at the precise moment an authorized user requests to view them.</span>
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* RBAC */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
              <Server className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">4. Role-Based Access Control</h2>
          </div>
          
          <Card className="h-[280px] border-0 shadow-lg bg-white p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-md font-semibold text-slate-800">Strict Boundary Enforcement</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Not everyone can see everything. The system strictly enforces absolute boundaries between different types of users to prevent leaks.
              </p>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Departments</span>
                  <span className="text-xs text-slate-500">Can only upload & view their own</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                  <span className="text-xs font-bold text-indigo-700">Signatories</span>
                  <span className="text-xs text-slate-500">Can only view files assigned to them</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                  <span className="text-xs font-bold text-rose-700">SuperAdmins</span>
                  <span className="text-xs text-slate-500">System oversight & management only</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

      </div>

      {/* Comprehensive Threat Mitigation Section */}
      <section className="pt-8 border-t border-slate-200 mt-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Comprehensive Threat Mitigation</h2>
            <p className="text-slate-500 mt-1">Exactly how we neutralize both external attacks and internal sabotage.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Threat 1 */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-white relative overflow-hidden group">
            <div className="h-2 w-full bg-slate-800 absolute top-0 left-0"></div>
            <CardContent className="p-6 pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-full text-slate-700">
                  <Ghost className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Man-in-the-Middle (MitM)</h3>
              </div>
              <p className="text-sm text-slate-600">
                A hacker sits on the campus WiFi trying to intercept the document as it uploads.
              </p>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Protection
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Strict TLS 1.3 Encryption encrypts all data in transit. The hacker only sees a stream of meaningless random characters.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Threat 2 */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-white relative overflow-hidden group">
            <div className="h-2 w-full bg-slate-800 absolute top-0 left-0"></div>
            <CardContent className="p-6 pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-full text-slate-700">
                  <Skull className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Credential Stuffing</h3>
              </div>
              <p className="text-sm text-slate-600">
                A hacker uses a leaked password from another site to log into a Signatory's account.
              </p>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Protection
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Passwords don't sign documents. Even if they log in, they don't have the vault-locked Private Key to mathematically generate the signature.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Threat 3 */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-white relative overflow-hidden group">
            <div className="h-2 w-full bg-slate-800 absolute top-0 left-0"></div>
            <CardContent className="p-6 pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-full text-slate-700">
                  <DatabaseZap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Rogue Database Admin</h3>
              </div>
              <p className="text-sm text-slate-600">
                An insider with direct server access tries to manually change a "REJECTED" status to "APPROVED" in the database.
              </p>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Protection
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  The manual edit instantly breaks the mathematical Hash Chain. The ledger validation fails and the system throws a tamper alert.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Threat 4 */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-white relative overflow-hidden group">
            <div className="h-2 w-full bg-slate-800 absolute top-0 left-0"></div>
            <CardContent className="p-6 pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-full text-slate-700">
                  <Scissors className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Department Bypass</h3>
              </div>
              <p className="text-sm text-slate-600">
                A department user tries to force an unapproved document to show as "Verified".
              </p>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Protection
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  The cryptographic verification engine mathematically mandates exact digital signatures from required approvers. No signatures = No verification.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Threat 5 */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-white relative overflow-hidden group">
            <div className="h-2 w-full bg-slate-800 absolute top-0 left-0"></div>
            <CardContent className="p-6 pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-full text-slate-700">
                  <UserX className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Signatory Denial (Repudiation)</h3>
              </div>
              <p className="text-sm text-slate-600">
                A signatory approves a document, then later claims they never signed it and someone else did it.
              </p>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Protection
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Our ECDSA signatures provide absolute non-repudiation. Since only their specific private key could generate the cryptographic proof, their claim is mathematically proven false.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Threat 6 */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-white relative overflow-hidden group">
            <div className="h-2 w-full bg-slate-800 absolute top-0 left-0"></div>
            <CardContent className="p-6 pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-full text-slate-700">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Physical Server Theft</h3>
              </div>
              <p className="text-sm text-slate-600">
                Someone literally unplugs the database servers from the data center and steals the hard drives.
              </p>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Protection
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Documents and Private Keys are encrypted with Military-Grade AES-256. Without the master decryption key in memory, the stolen hard drives contain completely useless gibberish.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

    </div>
  );
}
