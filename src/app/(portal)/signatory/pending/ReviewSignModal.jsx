"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, ShieldCheck, XCircle, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ReviewSignModal({ document, onClose, onSuccess }) {
  const { user } = useAuth();
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let blobUrl = null;
    
    async function fetchDocument() {
      try {
        setLoadingFile(true);
        const token = await user.getIdToken();
        const res = await fetch(`/api/documents/${document.id}/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch document securely. Status: ${res.status}`);
        }

        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        
        // Extract original filename from header
        const disposition = res.headers.get('Content-Disposition');
        let filename = null;
        if (disposition && disposition.includes('filename=')) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
          if (matches != null && matches[1]) { 
            filename = matches[1].replace(/['"]/g, '');
          }
        }
        
        setDocBlobUrl({ url: blobUrl, type: blob.type, filename });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingFile(false);
      }
    }

    if (document) {
      fetchDocument();
    }

    return () => {
      // Cleanup to prevent memory leaks and dump plaintext stream
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [document, user]);

  const handleAction = async (actionType) => {
    if (!confirm(`Are you sure you want to ${actionType} this document? This cryptographic action is immutable.`)) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const token = await user.getIdToken();

      const res = await fetch('/api/workflows/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          documentId: document.id,
          action: actionType, // 'APPROVE' or 'REJECT'
          remarks
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Failed to ${actionType.toLowerCase()} document.`);
      }

      onSuccess(document.id); // Trigger success callback to remove from list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadLocalCopy = () => {
    if (!docBlobUrl) return;
    const a = window.document.createElement('a');
    a.href = docBlobUrl.url;
    a.download = docBlobUrl.filename || document.originalName || `${document.title}.bin`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{document.title}</h2>
            <p className="text-sm text-slate-500">Submitted by: {document.departmentId}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Document Preview Pane */}
          <div className="flex-1 bg-slate-100 flex flex-col relative border-r border-slate-200">
            {loadingFile && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10">
                <div className="animate-pulse text-slate-500 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 animate-spin" /> Decrypting stream...
                </div>
              </div>
            )}
            
            {error && !docBlobUrl && (
              <div className="flex-1 flex items-center justify-center text-rose-500 p-8 text-center">
                <div>
                  <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {docBlobUrl && (
              <div className="flex-1 overflow-hidden p-4">
                {docBlobUrl.type === 'application/pdf' ? (
                  <object 
                    data={`${docBlobUrl.url}#toolbar=0&navpanes=0`} 
                    type="application/pdf"
                    className="w-full h-full rounded shadow-sm bg-white"
                  >
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center h-full">
                      <FileText className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="mb-4">Your browser's built-in PDF viewer has blocked the secure inline preview.</p>
                      <Button onClick={downloadLocalCopy} variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Download to View
                      </Button>
                    </div>
                  </object>
                ) : docBlobUrl.type.startsWith('image/') ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto bg-white rounded shadow-sm p-4">
                    <img src={docBlobUrl.url} alt="Document Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-white rounded shadow-sm h-full">
                    <FileText className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="mb-4">Preview not available for this file type ({docBlobUrl.type}).</p>
                    <Button onClick={downloadLocalCopy} variant="outline">
                      <Download className="w-4 h-4 mr-2" /> Download to View
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Pane */}
          <div className="w-full md:w-96 flex flex-col bg-white overflow-y-auto">
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-semibold text-slate-900 mb-4">Cryptographic Action</h3>
              
              <div className="space-y-4 flex-1">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <strong>Warning:</strong> Actions taken here are cryptographically signed and immutable.
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
                    placeholder="Enter any comments or reasons for your decision..."
                    disabled={isSubmitting}
                  />
                </div>
                
                {error && docBlobUrl && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
                    {error}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                  size="lg"
                  onClick={() => handleAction('APPROVE')}
                  disabled={isSubmitting || loadingFile}
                >
                  {isSubmitting ? 'Signing...' : (
                    <><ShieldCheck className="w-5 h-5 mr-2" /> Approve & Sign Document</>
                  )}
                </Button>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => handleAction('REJECT')}
                    disabled={isSubmitting || loadingFile}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-600"
                    onClick={downloadLocalCopy}
                    disabled={!docBlobUrl || loadingFile}
                  >
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </Card>
    </div>
  );
}
