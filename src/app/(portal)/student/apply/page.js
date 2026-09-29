"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Music, 
  Award, 
  CreditCard,
  Building,
  AlertCircle
} from 'lucide-react';

export default function StudentApplyPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [signatories, setSignatories] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [resolvedPipeline, setResolvedPipeline] = useState([]);

  // Fetch templates, signatories and profile
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();

        // 1. Fetch templates
        const resTemplates = await fetch('/api/workflows/templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resTemplates.ok) {
          const tData = await resTemplates.json();
          setTemplates(tData.templates || []);
        }

        // 2. Fetch signatories
        const resUsers = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let allSigs = [];
        if (resUsers.ok) {
          const uData = await resUsers.json();
          allSigs = uData.users || [];
          setSignatories(allSigs);
        }

        // 3. Fetch departments & current student info
        const resDept = await fetch('/api/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resDept.ok) {
          const deptData = await resDept.json();
          const deptSignatories = deptData.signatories || [];

          // Get my user profile
          const me = allSigs.find(u => u.id === user.uid) || {
            departmentId: 'CTech',
            department: 'Computing Technologies',
            section: 'Section A',
            year: '3rd Year'
          };

          // Find assigned FA
          const fa = deptSignatories.find(s => s.id === me.facultyAdvisorId) ||
                     deptSignatories.find(s => (s.departmentId === 'CTech' || s.department === 'CTech') && s.designation?.includes('Faculty Advisor')) ||
                     deptSignatories[0];

          // Find AA
          const aa = deptSignatories.find(s => (s.departmentId === me.departmentId || s.department === me.departmentId) && s.designation?.includes('Academic Advisor')) ||
                     deptSignatories.find(s => s.designation?.includes('Academic Advisor'));

          // Find HOD
          const hod = deptSignatories.find(s => (s.departmentId === me.departmentId || s.department === me.departmentId) && s.designation?.includes('Head of Department')) ||
                      deptSignatories.find(s => s.designation?.includes('Head of Department'));

          // Find Dean
          const dean = deptSignatories.find(s => s.designation?.includes('Dean') || s.email?.startsWith('dean'));

          // Find Chairperson
          const chairperson = deptSignatories.find(s => s.designation?.includes('Chairperson') && !s.designation?.includes('Associate'));

          setStudentProfile({
            ...me,
            fa,
            aa,
            hod,
            dean,
            chairperson
          });
        }
      } catch (err) {
        console.error('Error loading template application data:', err);
      }
    }
    loadData();
  }, [user]);

  // When a template is selected, auto-resolve pipeline and populate title/description
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.name);
    setDescription(tpl.description || '');

    if (!studentProfile) return;

    // Resolve approver sequence based on template role requirements
    const pipeline = [];

    // Always FA at Step 1
    if (studentProfile.fa) {
      pipeline.push({ ...studentProfile.fa, stage: 1, roleLabel: 'Faculty Advisor (FA) Gatekeeper', isGatekeeper: true });
    }

    const rolesNeeded = tpl.approverRoles || ['FA', 'AA'];

    if (rolesNeeded.includes('AA') && studentProfile.aa && studentProfile.aa.id !== studentProfile.fa?.id) {
      pipeline.push({ ...studentProfile.aa, stage: pipeline.length + 1, roleLabel: 'Academic Advisor (AA)' });
    }

    if (rolesNeeded.includes('HOD') && studentProfile.hod) {
      pipeline.push({ ...studentProfile.hod, stage: pipeline.length + 1, roleLabel: 'Head of Department (HOD)' });
    }

    if (rolesNeeded.includes('Chairperson') && studentProfile.chairperson) {
      pipeline.push({ ...studentProfile.chairperson, stage: pipeline.length + 1, roleLabel: 'Chairperson, Computing' });
    }

    if (rolesNeeded.includes('Dean') && studentProfile.dean) {
      pipeline.push({ ...studentProfile.dean, stage: pipeline.length + 1, roleLabel: 'Dean, School of Computing' });
    }

    setResolvedPipeline(pipeline);
  };

  // Submit Application
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || resolvedPipeline.length === 0 || !title) return;
    setUploading(true);

    try {
      const token = await user.getIdToken();
      const approverIds = resolvedPipeline.map(p => p.id);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('templateId', selectedTemplate ? selectedTemplate.id : 'CUSTOM');
      formData.append('facultyAdvisorId', studentProfile?.fa?.id || '');
      formData.append('requiredApprovers', JSON.stringify(approverIds));

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        router.push('/student/submissions?success=true');
      } else {
        const errData = await res.json();
        alert('Submission failed: ' + (errData.error || 'Server error'));
        setUploading(false);
      }
    } catch (err) {
      console.error('Error submitting document:', err);
      alert('Network or cryptographic upload error.');
      setUploading(false);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All 15 Templates' },
    { id: 'Academic', label: 'Academic & OD/ML' },
    { id: 'Events', label: 'Events & Hackathons' },
    { id: 'Campus Facilities', label: 'Campus & Stalls' },
    { id: 'Administrative', label: 'NOC & Grants' }
  ];

  const filteredTemplates = filterCategory === 'ALL'
    ? templates
    : templates.filter(t => t.category === filterCategory);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Pre-Configured College Workflows
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Apply for Institutional Approval</h1>
        <p className="text-sm text-slate-500">
          Select an official SRM workflow template or configure custom approval routing.
        </p>
      </div>

      {/* Step 1: Template Selection */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Step 1: Choose Workflow Template</CardTitle>
              <CardDescription className="text-xs">Click a template to auto-populate the certified sequence of authorities</CardDescription>
            </div>
            {/* Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCategory(c.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    filterCategory === c.id
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {tpl.category}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                      )}
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 line-clamp-1 ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium">
                      {(tpl.approverRoles || []).join(' → ')}
                    </span>
                    <span className="text-indigo-600 font-semibold flex items-center">
                      Select <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Form & Gatekeeper Visualizer */}
      <Card className="border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-slate-900">Step 2: Document Details & Signatory Pipeline</CardTitle>
            <CardDescription className="text-xs">Review the mandatory gatekeeper and upload supporting document</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            {/* Resolved Approval Chain Visualizer */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Institutional Approval Chain (Sequential Gatekeeper)
              </Label>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                  {resolvedPipeline.map((signer, idx) => (
                    <React.Fragment key={signer.id || idx}>
                      <div className={`p-2.5 rounded-md border flex-1 text-left ${
                        signer.isGatekeeper 
                          ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/50' 
                          : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between gap-1 text-[11px] font-bold mb-1">
                          <span className={signer.isGatekeeper ? 'text-amber-800 flex items-center gap-1' : 'text-slate-700'}>
                            {signer.isGatekeeper && <Lock className="w-3 h-3 text-amber-600" />}
                            Stage {idx + 1}
                          </span>
                          {signer.isGatekeeper && (
                            <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1 py-0.5 rounded font-semibold uppercase">
                              FA Gatekeeper
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {signer.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {signer.roleLabel || signer.designation}
                        </div>
                      </div>

                      {idx < resolvedPipeline.length - 1 && (
                        <div className="hidden md:flex text-slate-400 items-center justify-center font-bold px-0.5">
                          →
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 mt-2.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Enforced Rule: Your Faculty Advisor must review & sign before subsequent authorities receive this document.</span>
                </p>
              </div>
            </div>

            {/* Document Title & Description */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Application Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. On-Duty Permission for National Hackathon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Application Details & Justification
                </Label>
                <textarea
                  id="desc"
                  rows={3}
                  className="w-full p-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                  placeholder="Provide event dates, roll numbers, purpose, and relevant justification for the faculty..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Supporting Document (Letter, Proof, or Brochure)
              </Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50/60 transition-colors">
                <Upload className="w-8 h-8 mb-2 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-800">Choose file or drag & drop</span>
                <span className="text-xs text-slate-400 mt-0.5">PDF or Excel up to 50MB (Encrypted on upload)</span>
                <input
                  id="docFile"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.xlsx,.xls"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs font-medium"
                  onClick={() => document.getElementById('docFile').click()}
                >
                  Browse Document
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

          <CardFooter className="flex items-center justify-between border-t p-4 bg-slate-50/70">
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
              disabled={uploading || !file || !title || resolvedPipeline.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-6 shadow-sm"
            >
              {uploading ? 'Encrypting & Routing to FA...' : 'Submit to Faculty Advisor for Preliminary Approval'}
            </Button>
          </CardFooter>
        </form>
      </Card>

    </div>
  );
}
