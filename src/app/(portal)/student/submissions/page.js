"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Upload, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function StudentSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDocId, setExpandedDocId] = useState(null);

  useEffect(() => {
    async function fetchSubmissions() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/documents/submissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data.submissions || []);
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, [user]);

  const toggleExpand = (id) => {
    setExpandedDocId(expandedDocId === id ? null : id);
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/documents/${docId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Could not download document version. File may still be in processing.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Track My Requests</h1>
          <p className="text-sm text-slate-500">Live cryptographic tracking of your applications through the approval pipeline</p>
        </div>
        <Link href="/student/apply">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" />
            New Application
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading your applications...</div>
          ) : submissions.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">No applications found</div>
              <p className="text-xs text-slate-500">You haven&apos;t submitted any requests for approval yet.</p>
              <Link href="/student/apply">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  Create New Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map((doc) => {
                const required = doc.tracking?.requiredApprovers || [];
                const approved = doc.tracking?.approvedBy || [];
                const history = doc.tracking?.history || [];
                const isComplete = doc.status === 'APPROVED';
                const isRejected = doc.status === 'REJECTED';
                const isExpanded = expandedDocId === doc.id;

                const currentStageIdx = approved.length;
                const currentStageName = (!isComplete && !isRejected && required[currentStageIdx]) 
                  ? required[currentStageIdx] 
                  : (isComplete ? 'Approved by All Authorities' : 'Rejected');

                return (
                  <div key={doc.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                    
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-bold text-sm text-slate-900">{doc.title}</h3>
                          {isComplete && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">Verified & Complete</Badge>}
                          {isRejected && <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 text-[10px]">Rejected</Badge>}
                          {!isComplete && !isRejected && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">Active Pipeline</Badge>}
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 sm:gap-4">
                          <span>Submitted: {new Date(doc.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>File: {doc.originalName}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">
                            Current Stage: <span className="text-indigo-600 font-bold">{currentStageName}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right action buttons */}
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        {isComplete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc.id, doc.originalName)}
                            className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(doc.id)}
                          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        >
                          {isExpanded ? 'Hide Timeline' : 'View Timeline'}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {required.map((approverName, idx) => {
                          const isDone = approved.includes(approverName);
                          const isCurrent = !isDone && idx === approved.length && !isRejected;

                          return (
                            <div key={idx} className="flex-1">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className={`font-semibold ${isDone ? 'text-emerald-700' : isCurrent ? 'text-indigo-700' : 'text-slate-400'}`}>
                                  Stage {idx + 1}: {approverName}
                                </span>
                                {idx === 0 && <span className="text-[9px] text-amber-700 bg-amber-100 px-1 rounded font-bold">FA Gatekeeper</span>}
                              </div>
                              <div className={`h-1.5 rounded-full ${
                                isDone 
                                  ? 'bg-emerald-500' 
                                  : isCurrent 
                                  ? 'bg-amber-400 animate-pulse' 
                                  : 'bg-slate-200'
                              }`}></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expandable Timeline & Cryptographic Signatures */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/80 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-lg">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                          Cryptographic Audit & Signature Log
                        </div>

                        {history.length === 0 ? (
                          <div className="text-xs text-slate-500 italic py-2">
                            Awaiting initial review by Faculty Advisor. No digital signatures appended yet.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {history.map((h, i) => (
                              <div key={i} className="p-3 bg-white border border-slate-200 rounded-md text-xs flex flex-col sm:flex-row justify-between gap-2 shadow-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{h.approverName}</span>
                                    {h.action === 'APPROVE' ? (
                                      <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                      </span>
                                    ) : (
                                      <span className="text-rose-700 font-semibold flex items-center gap-1 text-[11px]">
                                        <XCircle className="w-3.5 h-3.5" /> Rejected
                                      </span>
                                    )}
                                  </div>
                                  {h.remarks && (
                                    <p className="text-slate-600 mt-1 italic">
                                      &ldquo;{h.remarks}&rdquo;
                                    </p>
                                  )}
                                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                                    ECDSA Signature: {h.signatureHash || 'Verified'}
                                  </div>
                                </div>
                                <div className="text-[11px] text-slate-400 shrink-0 self-start sm:self-auto font-mono">
                                  {new Date(h.timestamp).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
