"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ViewDocumentModal from './ViewDocumentModal';

export default function SignatoryHistoryPage() {
  const { user } = useAuth();
  const [historyDocs, setHistoryDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        // Assume an endpoint exists or will exist: /api/documents/history
        // Since we may not have this backend implemented yet, we'll gracefully handle 404s
        const res = await fetch('/api/documents/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistoryDocs(data.historyDocs || []);
        } else {
          // Fallback if endpoint is missing for now
          setHistoryDocs([]);
        }
      } catch (err) {
        console.error('Error fetching history docs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  if (loading) return <div className="text-slate-500">Loading history...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Signing History</h1>
          <p className="text-sm text-slate-500">Log of all documents you have successfully cryptographically signed.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {historyDocs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Signed On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {doc.title}
                    </TableCell>
                    <TableCell>{doc.departmentId}</TableCell>
                    <TableCell>{doc.signedDate || 'Unknown'}</TableCell>
                    <TableCell>
                      {doc.userAction === 'REJECT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Signed
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600" onClick={() => setViewDoc(doc)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Document
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No Signatures Yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                You haven't signed any documents yet. Once you cryptographically authorize a pending document, it will appear here in your permanent audit log.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {viewDoc && (
        <ViewDocumentModal 
          document={viewDoc} 
          onClose={() => setViewDoc(null)} 
        />
      )}
    </div>
  );
}
