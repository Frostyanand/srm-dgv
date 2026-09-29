"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  Clock, 
  CheckCircle,
  FileSearch
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function Sidebar() {
  const { role } = useAuth();
  const pathname = usePathname();

  const routes = {
    SUPER_ADMIN: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Users & Signatories', path: '/admin/users', icon: Users },
      { name: 'Workflows', path: '/admin/workflows', icon: FileText },
      { name: 'Audit Logs', path: '/admin/audit', icon: ShieldCheck },
      { name: 'Security Events', path: '/admin/security-events', icon: ShieldAlert },
    ],
    DEPARTMENT_USER: [
      { name: 'Dashboard', path: '/department', icon: LayoutDashboard },
      { name: 'Upload Document', path: '/department/upload', icon: Upload },
      { name: 'Submissions', path: '/department/submissions', icon: FileText },
    ],
    SIGNATORY: [
      { name: 'Dashboard', path: '/signatory', icon: LayoutDashboard },
      { name: 'Pending Approvals', path: '/signatory/pending', icon: Clock },
      { name: 'History', path: '/signatory/history', icon: CheckCircle },
    ]
  };

  const currentRoutes = routes[role] || [];

  return (
    <div className="flex flex-col w-64 h-screen border-r bg-slate-900 text-slate-300">
      <div className="flex items-center justify-center gap-2.5 h-16 border-b border-slate-800 px-4">
        <Image src="/image.png" alt="SRM Logo" width={28} height={28} className="object-contain" />
        <span className="text-lg font-bold text-white tracking-wider">SRM DGV</span>
      </div>
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {currentRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.path || pathname.startsWith(route.path + '/');
            return (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                {route.name}
              </Link>
            );
          })}
          
          {/* Shared Routes */}
          <div className="pt-6 pb-2">
            <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System Trust
            </div>
          </div>
          <Link
            href="/verify-document"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === '/verify-document' 
                ? "bg-slate-800 text-white" 
                : "text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
            )}
          >
            <FileSearch className="w-5 h-5 mr-3 shrink-0" />
            Verify Document
          </Link>
          <Link
            href="/security"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === '/security' 
                ? "bg-slate-800 text-white" 
                : "text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
            )}
          >
            <ShieldCheck className="w-5 h-5 mr-3 shrink-0" />
            Security Architecture
          </Link>
        </nav>
      </div>
      <div className="p-4 border-t border-slate-800 text-xs text-center text-slate-500">
        Role: {role}
      </div>
    </div>
  );
}
