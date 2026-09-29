"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, FileText, Activity, Upload, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignatoryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    signed: 0,
    mySubmissions: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [signatoryInfo, setSignatoryInfo] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        
        // 1. Fetch pending docs to get the count
        const resPending = await fetch('/api/documents/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 2. Fetch history docs to get the signed count
        const resHistory = await fetch('/api/documents/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // 3. Fetch submissions submitted by this faculty member (dual capability)
        const resSubmissions = await fetch('/api/documents/submissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // 4. Fetch user profile for designation
        const resUsers = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let pendingCount = 0;
        let signedCount = 0;
        let mySubmissionsCount = 0;

        if (resPending.ok) {
          const dataPending = await resPending.json();
          pendingCount = (dataPending.pendingDocs || []).length;
        }
        if (resHistory.ok) {
          const dataHistory = await resHistory.json();
          signedCount = (dataHistory.historyDocs || []).length;
        }
        if (resSubmissions.ok) {
          const dataSub = await resSubmissions.json();
          mySubmissionsCount = (dataSub.submissions || []).length;
        }
        if (resUsers.ok) {
          const uData = await resUsers.json();
          const me = (uData.users || []).find(u => u.id === user.uid);
          if (me) setSignatoryInfo(me);
        }

        setStats({
          pending: pendingCount,
          signed: signedCount,
          mySubmissions: mySubmissionsCount,
          total: pendingCount + signedCount
        });
      } catch (err) {
        console.error('Error fetching signatory stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Welcome & Faculty Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Cryptographic Signatory Authority
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {signatoryInfo?.name || user?.displayName || 'Faculty Authority'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {signatoryInfo?.designation || 'Signatory Authority'} • {signatoryInfo?.department || 'School of Computing'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <Link href="/signatory/pending" className="flex-1 md:flex-none">
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-2 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              Review Queue ({stats.pending})
            </Button>
          </Link>
          <Link href="/department/upload" className="flex-1 md:flex-none">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 text-xs sm:text-sm">
              <Upload className="w-4 h-4" />
              Submit Document
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-900">Pending Approvals</CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-950">{loading ? '-' : stats.pending}</div>
            <p className="text-xs text-amber-700 mt-1">Requires your signature</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-900">Documents Signed</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-950">{loading ? '-' : stats.signed}</div>
            <p className="text-xs text-emerald-700 mt-1">Cryptographically signed</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-900">My Submissions</CardTitle>
            <Upload className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-950">{loading ? '-' : stats.mySubmissions}</div>
            <p className="text-xs text-indigo-700 mt-1">Docs you submitted (Dual Role)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">Total Activity</CardTitle>
            <Activity className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{loading ? '-' : stats.total}</div>
            <p className="text-xs text-slate-500 mt-1">Actions across all workflows</p>
          </CardContent>
        </Card>
      </div>

      {/* Dual Capability Feature Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-amber-100 rounded-lg text-amber-800 w-fit mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Inbound Approval Queue</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Review documents submitted by students and faculty where your cryptographic signature is required in the sequential approval pipeline.
            </p>
          </div>
          <Link href="/signatory/pending" className="mt-4">
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
              Open Pending Queue <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-indigo-100 rounded-lg text-indigo-800 w-fit mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Dual Capability: Initiate Submissions</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              As a faculty member, you can also author and submit official documents (e.g. lab requisitions, course syllabi, event proposals) to higher authorities (HOD, Dean).
            </p>
          </div>
          <Link href="/department/upload" className="mt-4">
            <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5">
              Submit New Document <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
