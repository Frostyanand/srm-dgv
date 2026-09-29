"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DocumentUploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [signatories, setSignatories] = useState([]);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingSignatories, setLoadingSignatories] = useState(true);

  useEffect(() => {
    async function fetchSignatories() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // The API already filters for active SIGNATORY / SUPER_ADMIN for DEPARTMENT_USER
          setSignatories(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching signatories:', err);
      } finally {
        setLoadingSignatories(false);
      }
    }
    fetchSignatories();
  }, [user]);

  const toggleApprover = (id) => {
    if (selectedApprovers.includes(id)) {
      setSelectedApprovers(selectedApprovers.filter(a => a !== id));
    } else {
      setSelectedApprovers([...selectedApprovers, id]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || selectedApprovers.length === 0 || !title) return;
    setUploading(true);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('requiredApprovers', JSON.stringify(selectedApprovers));

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        alert('Document successfully uploaded for approval');
        setFile(null);
        setTitle('');
        setDescription('');
        setSelectedApprovers([]);
      } else {
        const errData = await res.json();
        alert('Upload failed: ' + errData.error);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload Document</h1>
        <p className="text-sm text-slate-500">Submit a new document and route it to specific signatories for approval.</p>
      </div>

      <Card>
        <form onSubmit={handleUpload}>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Bonafide Certificate - John Doe" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Input 
                  id="desc" 
                  placeholder="Additional details..." 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <Label>Required Signatories</Label>
                <p className="text-xs text-slate-500 mt-1">
                  Select the individuals who must digitally sign this document before it is fully approved.
                </p>
              </div>

              {loadingSignatories ? (
                <div className="text-sm text-slate-500 py-4 text-center border border-slate-200 rounded-md bg-slate-50">
                  Loading available signatories...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 border border-slate-200 rounded-md bg-slate-50/50">
                  {signatories.map(sig => {
                    const isSelected = selectedApprovers.includes(sig.id);
                    return (
                      <div 
                        key={sig.id}
                        onClick={() => toggleApprover(sig.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-100 hover:bg-slate-50'}`}
                      >
                        <div className="mt-0.5 text-indigo-600">
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {sig.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">
                            {sig.email}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {signatories.length === 0 && (
                    <div className="col-span-full text-center py-6 text-slate-500 text-sm">
                      No active signatories found in the system.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="file">File (PDF or Excel)</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 mb-3 text-slate-400" />
                <span className="text-sm font-medium">Click to upload or drag and drop</span>
                <span className="text-xs mt-1">PDF, XLSX up to 50MB</span>
                <input 
                  id="file" 
                  type="file" 
                  className="hidden" 
                  onChange={e => setFile(e.target.files[0])}
                  accept=".pdf,.xlsx,.xls"
                  required
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-6"
                  onClick={() => document.getElementById('file').click()}
                >
                  Select File
                </Button>
                {file && <p className="mt-3 text-sm text-emerald-600 font-medium px-4 py-2 bg-emerald-50 rounded-md border border-emerald-100">{file.name}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-6 bg-slate-50/50">
            <Button type="submit" disabled={uploading || selectedApprovers.length === 0 || !file}>
              {uploading ? 'Uploading & Routing...' : 'Submit to Selected Signatories'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
