"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, ChevronDown, ChevronUp, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubmissionsHistoryPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
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
    };

    fetchSubmissions();
  }, [user]);

  const toggleExpand = (id) => {
    if (expandedDoc === id) setExpandedDoc(null);
    else setExpandedDoc(id);
  };

  const handleRecall = async (id) => {
    if (!confirm('Are you sure you want to recall (delete) this pending submission? This action cannot be undone.')) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSubmissions(submissions.filter(doc => doc.id !== id));
        if (expandedDoc === id) setExpandedDoc(null);
        alert('Submission successfully recalled.');
      } else {
        const err = await res.json();
        alert('Failed to recall: ' + err.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error recalling submission.');
    }
  };

  const handleDownload = async (id, title, status) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/documents/${id}/download`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Use the filename from Content-Disposition if available
        const disposition = res.headers.get('Content-Disposition');
        let filename = title;
        if (disposition && disposition.indexOf('filename=') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) { 
            filename = matches[1].replace(/['"]/g, '');
          }
        } else if (status === 'APPROVED') {
          filename = title.replace(/\.[^/.]+$/, "") + '_Verified_Bundle.zip';
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const err = await res.json();
        alert('Failed to download: ' + err.error);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Error downloading file.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading submissions...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submissions History</h1>
        <p className="text-sm text-slate-500">Track the approval progress of your uploaded documents.</p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No submissions found.
                  </TableCell>
                </TableRow>
              )}
              
              {submissions.map((doc) => (
                <React.Fragment key={doc.id}>
                  <TableRow 
                    className={`cursor-pointer transition-colors ${expandedDoc === doc.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                    onClick={() => toggleExpand(doc.id)}
                  >
                    <TableCell>
                      {expandedDoc === doc.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium text-slate-900">{doc.title}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{doc.originalName}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {doc.tracking.approvedBy.map((appr, idx) => (
                          <div key={idx} className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px] font-bold text-emerald-700" title={`Approved by ${appr}`}>
                            {appr.charAt(0)}
                          </div>
                        ))}
                        {doc.tracking.pendingApprovers.map((pend, idx) => (
                          <div key={`p-${idx}`} className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500" title={`Pending from ${pend}`}>
                            {pend.charAt(0)}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {doc.tracking.approvedBy.length} / {doc.tracking.requiredApprovers.length} Approved
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.status === 'PENDING' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>}
                      {doc.status === 'APPROVED' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>}
                      {doc.status === 'REJECTED' && <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {doc.status === 'PENDING' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2"
                          onClick={() => handleRecall(doc.id)}
                        >
                          Recall
                        </Button>
                      )}
                      {doc.status === 'APPROVED' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 px-2"
                          onClick={() => handleDownload(doc.id, doc.originalName || doc.title, doc.status)}
                        >
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Details Row */}
                  {expandedDoc === doc.id && (
                    <TableRow className="bg-slate-50 border-b">
                      <TableCell colSpan={6} className="p-0">
                        <div className="p-6 border-l-4 border-indigo-500">
                          <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <History className="w-4 h-4 text-indigo-500" />
                            Workflow Tracking Timeline
                          </h4>
                          
                          <div className="space-y-4">
                            {/* History Timeline */}
                            {doc.tracking.history.length > 0 ? (
                              <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-4">
                                {doc.tracking.history.map((evt, idx) => (
                                  <div key={idx} className="relative pl-6">
                                    <span className={`absolute -left-2.5 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-slate-50 ${evt.action === 'APPROVE' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                      {evt.action === 'APPROVE' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                                    </span>
                                    <div className="text-sm">
                                      <span className="font-semibold text-slate-900">{evt.approverName}</span>
                                      <span className="text-slate-500 ml-1">
                                        {evt.action === 'APPROVE' ? 'approved this document.' : 'rejected this document.'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                      {new Date(evt.timestamp).toLocaleString()}
                                    </div>
                                    {evt.remarks && (
                                      <div className="mt-2 p-3 bg-white border border-slate-200 rounded-md text-sm text-slate-700 italic">
                                        "{evt.remarks}"
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 ml-3">No actions have been taken on this document yet.</p>
                            )}

                            {/* Pending State display */}
                            {doc.status === 'PENDING' && doc.tracking.pendingApprovers.length > 0 && (
                              <div className="relative pl-9 ml-3 mt-4">
                                <span className="absolute -left-2.5 top-0.5 w-5 h-5 rounded-full bg-amber-100 ring-4 ring-slate-50 flex items-center justify-center">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                </span>
                                <div className="text-sm font-medium text-slate-700">Waiting for approval from:</div>
                                <div className="text-sm text-slate-500 mt-1">
                                  {doc.tracking.pendingApprovers.join(', ')}
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
