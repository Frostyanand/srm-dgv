"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReviewSignModal from './ReviewSignModal';

export default function PendingApprovalsPage() {
  const { user } = useAuth();
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    async function fetchPendingDocs() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/documents/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPendingDocs(data.pendingDocs || []);
        }
      } catch (err) {
        console.error('Error fetching pending docs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPendingDocs();
  }, [user]);

  const handleModalSuccess = (documentId) => {
    setPendingDocs(docs => docs.filter(doc => doc.id !== documentId));
    setSelectedDoc(null);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading pending approvals...</div>;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pending Approvals</h1>
          <p className="text-sm text-slate-500">Documents requiring your cryptographic signature.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Document Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Parallel Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    You have no pending documents to sign.
                  </TableCell>
                </TableRow>
              )}
              {pendingDocs.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{doc.title}</TableCell>
                  <TableCell className="text-slate-600">{doc.departmentId}</TableCell>
                  <TableCell className="text-slate-600">{doc.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-medium text-slate-700">{(doc.approvedBy || []).length} / {(doc.requiredApprovers || []).length}</span>
                      <div className="flex -space-x-2">
                        {(doc.requiredApprovers || []).map((req, i) => {
                          const isApproved = (doc.approvedBy || []).includes(req);
                          return (
                            <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${isApproved ? 'bg-emerald-500' : 'bg-slate-200'}`} title={`${req}: ${isApproved ? 'Approved' : 'Pending'}`}>
                              {isApproved && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review & Sign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedDoc && (
        <ReviewSignModal 
          document={selectedDoc} 
          onClose={() => setSelectedDoc(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
