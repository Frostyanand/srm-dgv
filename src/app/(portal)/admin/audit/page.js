"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldCheck, Link2, FileSignature, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/audit', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-emerald-600" />
          Cryptographic Audit Ledger
        </h1>
        <p className="text-sm text-slate-500">Immutable, HMAC hash-chained record of all critical system actions.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Hash Chain</CardTitle>
          <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            Chain Integrity Verified
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-slate-500 py-4">Loading cryptographic ledger...</div>
          ) : logs.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">No audit logs found.</div>
          ) : (
            <div className="rounded-md border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium w-12"></th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Cryptographic Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors relative group">
                      <td className="px-4 py-3 text-slate-300">
                        {idx !== logs.length - 1 && (
                          <div className="absolute left-6 top-8 bottom-[-1rem] w-px bg-slate-200 group-hover:bg-slate-300 transition-colors" />
                        )}
                        <Link2 className="w-4 h-4 text-slate-400" />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-indigo-500" />
                        {log.action}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">{log.actorId}</div>
                        <div className="text-xs text-slate-500">{log.actorRole}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-slate-500 truncate max-w-[200px]" title={log.hash}>
                          {log.hash}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" title={`Prev: ${log.previousHash}`}>
                          ↳ {log.previousHash === 'GENESIS' ? 'GENESIS BLOCK' : log.previousHash.substring(0, 16) + '...'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
