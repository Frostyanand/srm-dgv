"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckSquare, Square, Sparkles, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DocumentUploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [signatories, setSignatories] = useState([]);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [loadingSignatories, setLoadingSignatories] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();

        // 1. Fetch signatories
        const resUsers = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resUsers.ok) {
          const data = await resUsers.json();
          setSignatories(data.users || []);
        }

        // 2. Fetch templates
        const resTemplates = await fetch('/api/workflows/templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resTemplates.ok) {
          const tData = await resTemplates.json();
          setTemplates(tData.templates || []);
        }
      } catch (err) {
        console.error('Error fetching upload data:', err);
      } finally {
        setLoadingSignatories(false);
      }
    }
    fetchData();
  }, [user]);

  const toggleApprover = (id) => {
    if (selectedApprovers.includes(id)) {
      setSelectedApprovers(selectedApprovers.filter(a => a !== id));
    } else {
      setSelectedApprovers([...selectedApprovers, id]);
    }
  };

  const handleApplyTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.name);
    setDescription(tpl.description || '');

    // Auto-select matching signatories based on template roles
    const matchingIds = [];
    (tpl.approverRoles || []).forEach(roleNeeded => {
      const match = signatories.find(s => {
        if (roleNeeded === 'Dean') return s.designation?.includes('Dean') || s.email?.startsWith('dean');
        if (roleNeeded === 'Chairperson') return s.designation?.includes('Chairperson');
        if (roleNeeded === 'HOD') return s.designation?.includes('Head of Department');
        if (roleNeeded === 'AA') return s.designation?.includes('Academic Advisor');
        if (roleNeeded === 'FA') return s.designation?.includes('Faculty Advisor');
        return false;
      });
      if (match && !matchingIds.includes(match.id)) {
        matchingIds.push(match.id);
      }
    });

    if (matchingIds.length > 0) {
      setSelectedApprovers(matchingIds);
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
      formData.append('templateId', selectedTemplate ? selectedTemplate.id : 'CUSTOM');
      formData.append('requiredApprovers', JSON.stringify(selectedApprovers));

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        router.push('/department/submissions?success=true');
      } else {
        const errData = await res.json();
        alert('Upload failed: ' + (errData.error || 'Server error'));
        setUploading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Initiate Document Submission</h1>
        <p className="text-sm text-slate-500">
          Author and submit institutional documents with cryptographic envelope encryption and sequential multi-signatory routing.
        </p>
      </div>

      {/* Quick Template Selector */}
      {templates.length > 0 && (
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Quick-Fill from 15 SRM Workflow Templates
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Click a template to auto-populate title and recommended signatory sequence
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {templates.slice(0, 8).map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                    selectedTemplate?.id === tpl.id
                      ? 'bg-indigo-600 text-white font-semibold border-indigo-600'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 shadow-xs">
        <form onSubmit={handleUpload}>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-slate-900">Document Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Document Title
                </Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Lab Infrastructure Budget Clearance - CTech" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Description / Institutional Context
                </Label>
                <Input 
                  id="desc" 
                  placeholder="Details regarding purpose, budget code, or committee recommendations..." 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Selected Sequential Pipeline Preview */}
            {selectedApprovers.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Active Sequential Signatory Sequence ({selectedApprovers.length} Stages)
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedApprovers.map((id, index) => {
                    const signer = signatories.find(s => s.id === id);
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-800 flex items-center gap-1 shadow-2xs">
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </span>
                          {signer ? signer.name : id}
                        </span>
                        {index < selectedApprovers.length - 1 && (
                          <span className="text-slate-400 font-bold text-xs">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signatories Checkbox Grid */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Select Sequential Signatories
                </Label>
                <span className="text-xs text-slate-500">
                  {selectedApprovers.length} selected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Click in the order approvals must occur (Stage 1 &rarr; Stage 2 &rarr; Stage 3).
              </p>

              {loadingSignatories ? (
                <div className="text-sm text-slate-500 py-6 text-center border border-slate-200 rounded-md bg-slate-50">
                  Loading available institutional signatories...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                  {signatories.map(sig => {
                    const isSelected = selectedApprovers.includes(sig.id);
                    const selectedIndex = selectedApprovers.indexOf(sig.id);

                    return (
                      <div 
                        key={sig.id}
                        onClick={() => toggleApprover(sig.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-50/80 border-indigo-300 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">
                              {selectedIndex + 1}
                            </span>
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                            {sig.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {sig.designation || sig.role}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {sig.email}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* File Upload Zone */}
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="file" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Document File (PDF or Excel)
              </Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 mb-2 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</span>
                <span className="text-xs text-slate-400 mt-0.5">Encrypted with AES-256 Envelope Encryption</span>
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
                  className="mt-4 text-xs font-medium"
                  onClick={() => document.getElementById('file').click()}
                >
                  Select File
                </Button>
                {file && (
                  <div className="mt-3 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-between border-t p-4 bg-slate-50/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="text-xs text-slate-600"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploading || selectedApprovers.length === 0 || !file || !title}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-6 shadow-sm"
            >
              {uploading ? 'Encrypting & Dispatching Pipeline...' : 'Initiate Approval Pipeline'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
