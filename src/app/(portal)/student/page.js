"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck,
  AlertCircle
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        
        // 1. Fetch user submissions
        const resSub = await fetch('/api/documents/submissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resSub.ok) {
          const data = await resSub.json();
          setSubmissions(data.submissions || []);
        }

        // 2. Fetch department structure / signatories to get profile details
        const resDept = await fetch('/api/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resDept.ok) {
          const deptData = await resDept.json();
          const allSignatories = deptData.signatories || [];
          
          // Look up user's own profile in users
          const resUsers = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resUsers.ok) {
            const uData = await resUsers.json();
            const me = (uData.users || []).find(u => u.id === user.uid) || {
              name: user.displayName || 'Student',
              department: 'CTech',
              section: 'Section A',
              year: '3rd Year'
            };
            
            // Find assigned FA
            const fa = allSignatories.find(s => s.id === me.facultyAdvisorId) || 
                       allSignatories.find(s => s.departmentId === me.departmentId && s.designation?.includes('Faculty Advisor')) ||
                       { name: 'Dr. Suresh (Faculty Advisor)', email: 'fa.ctech.secA@srmist.edu.in' };

            setStudentProfile({ ...me, fa });
          }
        }
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Derived statistics
  const totalSubmissions = submissions.length;
  const pendingCount = submissions.filter(s => s.status === 'PENDING').length;
  const approvedCount = submissions.filter(s => s.status === 'APPROVED').length;
  const rejectedCount = submissions.filter(s => s.status === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            Verified SRM Student Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {user?.displayName || studentProfile?.name || 'Student'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            School of Computing • {studentProfile?.department || 'CTech'} • {studentProfile?.section || 'Section A'} ({studentProfile?.year || '3rd Year'})
          </p>
          <div className="mt-2 text-xs text-indigo-200 flex items-center gap-1">
            <span className="font-semibold text-white">Designated FA Gatekeeper:</span> 
            {studentProfile?.fa ? `${studentProfile.fa.name} (${studentProfile.fa.email})` : 'Faculty Advisor'}
          </div>
        </div>

        <div className="flex gap-2.5 w-full md:w-auto">
          <Link href="/student/apply" className="flex-1 md:flex-none">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 text-xs sm:text-sm">
              <Upload className="w-4 h-4" />
              New Application
            </Button>
          </Link>
          <Link href="/student/departments" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs sm:text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Faculty Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalSubmissions}</div>
              <div className="text-xs text-slate-500">Total Applications</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-100 rounded-lg text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-900">{pendingCount}</div>
              <div className="text-xs text-amber-700">In Review Pipeline</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-900">{approvedCount}</div>
              <div className="text-xs text-emerald-700">Approved & Verified</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/30">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-rose-100 rounded-lg text-rose-700">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-900">{rejectedCount}</div>
              <div className="text-xs text-rose-700">Rejected / Returned</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Notice: Gatekeeper explanation */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-4 text-xs text-indigo-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-indigo-900">Institutional FA Gatekeeper Protocol:</span> All documents and permission requests submitted by students are automatically locked to your assigned Faculty Advisor (FA) at Stage 1. Once your FA reviews and cryptographically approves your application, it automatically advances to Academic Advisors, HOD, and School Dean. Irrelevant or unauthorized submissions are caught early at the faculty level.
        </div>
      </div>

      {/* Recent Applications Table */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Recent Applications & Status</CardTitle>
            <CardDescription className="text-xs">Live tracking of your approval requests through the faculty chain</CardDescription>
          </div>
          <Link href="/student/submissions">
            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading student applications...</div>
          ) : submissions.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-700">No applications submitted yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Apply for On-Duty (OD), Medical Leave, Event Permissions, or NOCs using pre-configured institutional templates.
              </p>
              <Link href="/student/apply">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs">
                  Create First Application
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.slice(0, 5).map((doc) => {
                const required = doc.tracking?.requiredApprovers || [];
                const approved = doc.tracking?.approvedBy || [];
                const isComplete = doc.status === 'APPROVED';
                const isRejected = doc.status === 'REJECTED';

                return (
                  <div key={doc.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{doc.title}</span>
                        {isComplete && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">Approved</Badge>}
                        {isRejected && <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 text-[10px]">Rejected</Badge>}
                        {!isComplete && !isRejected && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">In Progress</Badge>}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span>Submitted on {new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{doc.originalName || 'Document file'}</span>
                      </div>
                    </div>

                    {/* Stepper Progress */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500 font-medium mr-1">
                        Stage: {approved.length} of {required.length}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {required.map((approverName, idx) => {
                          const isDone = approved.includes(approverName);
                          const isCurrent = !isDone && idx === approved.length && !isRejected;

                          return (
                            <div 
                              key={idx}
                              className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1 ${
                                isDone 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                                  : isCurrent 
                                  ? 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-400' 
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title={approverName}
                            >
                              {isDone ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                              <span className="truncate max-w-[80px]">{approverName.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
