"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload, 
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkflowsDashboardPage() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkflows() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/workflows', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWorkflows(data.workflows || []);
        }
      } catch (err) {
        console.error('Error fetching workflows:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkflows();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-slate-500">
      <div className="flex items-center gap-3">
        <Clock className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="font-medium">Loading itinerary tracker...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Active Workflows</h1>
        <p className="text-slate-500 mt-1">Real-time cryptographic itinerary and verification journey of all documents.</p>
      </div>

      {workflows.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-64 text-slate-500">
            <FileText className="w-12 h-12 mb-4 text-slate-300" />
            <p>No active workflows found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {workflows.map((wf) => (
            <Card key={wf.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200">
              
              {/* Card Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{wf.title}</h3>
                  <p className="text-sm text-slate-500">{wf.department}</p>
                </div>
                <div>
                  {wf.status === 'PENDING' && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">
                      <Clock className="w-3 h-3 mr-1" /> Partially Verified
                    </Badge>
                  )}
                  {wf.status === 'COMPLETED' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Fully Verified
                    </Badge>
                  )}
                  {wf.status === 'REJECTED' && (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 px-3 py-1">
                      <AlertCircle className="w-3 h-3 mr-1" /> Rejected
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Body - Timeline Itinerary */}
              <CardContent className="p-8">
                <div className="relative pl-8 space-y-10">
                  {/* Vertical Line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />

                  {/* 1. Upload Node */}
                  <div className="relative">
                    <div className="absolute -left-[41px] bg-white p-1 rounded-full">
                      <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center shadow ring-4 ring-white">
                        <Upload className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Document Uploaded</h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Uploaded by <span className="font-medium text-slate-700">{wf.submitter.name}</span> ({wf.submitter.email})
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(wf.createdAt)}</p>
                    </div>
                  </div>

                  {/* 2. Signatures Node */}
                  <div className="relative">
                    <div className="absolute -left-[41px] bg-white p-1 rounded-full">
                      <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow ring-4 ring-white">
                        <FileText className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-4">Cryptographic Signatures (Parallel)</h4>
                      
                      <div className="space-y-4">
                        {wf.approvers.map((approver, idx) => (
                          <div key={idx} className="flex items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                            {/* Status Icon */}
                            <div className="mt-0.5 mr-4 shrink-0">
                              {approver.action === 'APPROVE' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                              {approver.action === 'REJECT' && <XCircle className="w-5 h-5 text-rose-500" />}
                              {approver.action === 'PENDING' && <Clock className="w-5 h-5 text-amber-500" />}
                            </div>
                            
                            {/* Approver Details */}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{approver.roleName}</p>
                              {approver.name !== approver.roleName && (
                                <p className="text-xs text-slate-500 mt-0.5">{approver.name}</p>
                              )}
                              
                              <div className="mt-2 text-sm">
                                {approver.action === 'APPROVE' && (
                                  <span className="text-emerald-700 font-medium flex items-center">
                                    Approved cryptographically on {formatDate(approver.timestamp)}
                                  </span>
                                )}
                                {approver.action === 'REJECT' && (
                                  <span className="text-rose-700 font-medium flex items-center">
                                    Rejected on {formatDate(approver.timestamp)}
                                  </span>
                                )}
                                {approver.action === 'PENDING' && (
                                  <span className="text-amber-700 font-medium">
                                    Awaiting signature...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Final Verification Node */}
                  <div className="relative">
                    <div className="absolute -left-[41px] bg-white p-1 rounded-full">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow ring-4 ring-white text-white ${
                        wf.status === 'COMPLETED' ? 'bg-emerald-500' : 
                        wf.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-300'
                      }`}>
                        {wf.status === 'COMPLETED' && <ShieldCheck className="w-3 h-3" />}
                        {wf.status === 'REJECTED' && <AlertCircle className="w-3 h-3" />}
                        {wf.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      </div>
                    </div>
                    <div>
                      {wf.status === 'COMPLETED' ? (
                        <>
                          <h4 className="text-sm font-semibold text-emerald-700">Journey Complete</h4>
                          <p className="text-sm text-slate-500 mt-0.5">Document is fully verified and immutable.</p>
                        </>
                      ) : wf.status === 'REJECTED' ? (
                        <>
                          <h4 className="text-sm font-semibold text-rose-700">Workflow Terminated</h4>
                          <p className="text-sm text-slate-500 mt-0.5">Document was rejected and requires resubmission.</p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-sm font-semibold text-slate-400">Final Verification Pending</h4>
                          <p className="text-sm text-slate-400 mt-0.5">Awaiting all required cryptographic signatures.</p>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
