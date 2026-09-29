"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldAlert, Clock, AlertTriangle, ShieldX, KeySquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SecurityEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/security-events', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch security events', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [user]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'RATE_LIMIT_TRIGGER': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'CSRF_FAILURE': return <ShieldX className="w-5 h-5 text-rose-500" />;
      case 'LOGIN_FAILURE': return <KeySquare className="w-5 h-5 text-indigo-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
          <ShieldAlert className="w-6 h-6 mr-2 text-rose-600" />
          Security Events (SIEM)
        </h1>
        <p className="text-sm text-slate-500">Live feed of intrusion attempts, rate limit triggers, and blocked requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-slate-500 py-4">Loading security feed...</div>
          ) : events.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">No security events detected.</div>
          ) : (
            <div className="rounded-md border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                    <th className="px-4 py-3 font-medium">IP Address</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        {getEventIcon(ev.eventType)}
                        {ev.eventType}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <pre className="text-xs bg-slate-100 p-1 rounded border">
                          {JSON.stringify(ev.details)}
                        </pre>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{ev.ipAddress}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(ev.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ev.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {ev.status}
                        </span>
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
