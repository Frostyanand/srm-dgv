"use client";

import React, { useState, useCallback } from 'react';
import { UploadCloud, CheckCircle2, XCircle, ShieldCheck, FileSearch, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function VerifyDocument({ isPublic = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  const calculateHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyFile = async (file) => {
    try {
      setVerifying(true);
      setError(null);
      setResult(null);
      setFileName(file.name);

      const fileHash = await calculateHash(file);

      const response = await fetch('/api/documents/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileHash }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      verifyFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      verifyFile(e.target.files[0]);
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto", isPublic ? "py-12 px-6" : "")}>
      <div className={cn("mb-10 text-center", !isPublic && "text-left")}>
        <h1 className={cn("text-3xl font-bold text-slate-900 flex items-center mb-4", isPublic && "justify-center text-4xl")}>
          <FileSearch className="mr-3 w-8 h-8 text-indigo-600" />
          Forensic Document Verification
        </h1>
        <p className={cn("mt-2 text-slate-600", isPublic ? "max-w-2xl mx-auto text-lg" : "max-w-3xl")}>
          Instantly verify the mathematical authenticity of any document signed on this platform. Our Cryptographic Hash Ledger checks the raw binary signature against our immutable database. The file never leaves your computer.
        </p>
      </div>

      {!result && !error && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-3 border-dashed rounded-xl p-16 text-center transition-all duration-200 cursor-pointer bg-white",
            isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50",
            verifying ? "pointer-events-none opacity-50" : ""
          )}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            disabled={verifying}
          />
          <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
            {verifying ? (
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
            ) : (
              <UploadCloud className="w-16 h-16 text-slate-400 mb-4" />
            )}
            
            <span className="text-xl font-semibold text-slate-700">
              {verifying ? 'Analyzing Cryptographic Hash...' : 'Drag & drop a document here'}
            </span>
            <span className="text-slate-500 mt-2">
              {verifying ? 'Comparing against Immutable Ledger' : 'or click to select a file'}
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Verification Failed</h2>
          <p className="text-red-700 font-medium text-lg mb-6 max-w-lg mx-auto">
            {error}
          </p>
          <div className="bg-white p-4 rounded-lg border border-red-100 text-left mb-6 inline-block w-full max-w-md">
            <h3 className="font-semibold text-slate-800 mb-2">What does this mean?</h3>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>The document may have been maliciously tampered with.</li>
              <li>Someone might have modified the contents (even a single space).</li>
              <li>The document was never officially signed on our platform.</li>
            </ul>
          </div>
          <div>
            <button 
              onClick={() => { setError(null); setFileName(''); }}
              className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Verify Another File
            </button>
          </div>
        </div>
      )}

      {result && result.verified && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col items-center text-center border-b border-emerald-200 pb-8 mb-8">
            <ShieldCheck className="w-20 h-20 text-emerald-500 mb-4" />
            <h2 className="text-3xl font-bold text-emerald-900 mb-2">Verified Authentic</h2>
            <p className="text-emerald-700 text-lg">
              This mathematical hash exactly matches an official document in our immutable ledger.
            </p>
            <div className="mt-4 inline-flex items-center px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Zero Tampering Detected
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                Document Details
              </h3>
              <div className="bg-white rounded-xl border border-emerald-100 p-5 space-y-4">
                <div>
                  <span className="text-sm text-slate-500 block">Title</span>
                  <span className="font-medium text-slate-900">{result.document.title}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-500 block">Department</span>
                  <span className="font-medium text-slate-900">{result.document.department}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-500 block">System Document ID</span>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{result.document.id}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-500 block">Uploaded File</span>
                  <span className="font-medium text-slate-900">{fileName}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                Cryptographic Signatures
              </h3>
              <div className="space-y-4">
                {result.signers.map((signer, index) => (
                  <div key={index} className="bg-white rounded-xl border border-emerald-100 p-4 flex items-start">
                    <div className="bg-emerald-100 p-2 rounded-lg mr-4 mt-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center">
                        {signer.name}
                        <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {signer.role}
                        </span>
                      </h4>
                      <p className="text-sm text-slate-500">{signer.email}</p>
                      <div className="mt-2 text-xs font-mono text-slate-400 truncate w-48" title={signer.signature}>
                        Sig: {signer.signature.substring(0, 20)}...
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(signer.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center pt-8 border-t border-emerald-200">
            <button 
              onClick={() => { setResult(null); setFileName(''); }}
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Verify Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
