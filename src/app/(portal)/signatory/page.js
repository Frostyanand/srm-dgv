"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, FileText, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignatoryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    signed: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        // Fetch pending docs to get the count
        const resPending = await fetch('/api/documents/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Fetch history docs to get the signed count
        const resHistory = await fetch('/api/documents/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resPending.ok && resHistory.ok) {
          const dataPending = await resPending.json();
          const dataHistory = await resHistory.json();
          
          const pendingCount = (dataPending.pendingDocs || []).length;
          const signedCount = (dataHistory.historyDocs || []).length;
          
          setStats({
            pending: pendingCount,
            signed: signedCount,
            total: pendingCount + signedCount
          });
        }
      } catch (err) {
        console.error('Error fetching signatory stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Signatory Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your document signing queue and history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Approvals</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{loading ? '-' : stats.pending}</div>
            <p className="text-xs text-slate-500 mt-1">Requires your signature</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Documents Signed</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{loading ? '-' : stats.signed}</div>
            <p className="text-xs text-slate-500 mt-1">Completed by you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Activity</CardTitle>
            <Activity className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{loading ? '-' : stats.total}</div>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900">Welcome to your signing portal</h3>
            <p className="text-sm text-indigo-700 mt-1">
              You can navigate to <strong>Pending Approvals</strong> from the sidebar to review and securely sign documents waiting for your cryptographic authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
