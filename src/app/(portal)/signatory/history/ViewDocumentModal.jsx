"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, ShieldCheck, XCircle, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ViewDocumentModal({ document, onClose }) {
  const { user } = useAuth();
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let blobUrl = null;
    
    async function fetchDocument() {
      try {
        setLoadingFile(true);
        const token = await user.getIdToken();
        const res = await fetch(`/api/documents/${document.id}/download?type=original`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch document securely. Status: ${res.status}`);
        }

        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        
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
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [document, user]);

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
      <Card className="w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{document.title}</h2>
            <p className="text-sm text-slate-500">Department: {document.departmentId} | Signed: {document.signedDate}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadLocalCopy} disabled={!docBlobUrl || loadingFile}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-slate-100 flex flex-col relative">
          {loadingFile && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10">
              <div className="animate-pulse text-slate-500 font-medium flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 animate-spin" /> Decrypting historical record...
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
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center h-full bg-white">
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
      </Card>
    </div>
  );
}
