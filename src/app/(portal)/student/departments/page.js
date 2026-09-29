"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Mail, 
  Search, 
  ShieldCheck, 
  Award,
  ChevronRight,
  BookOpen,
  Briefcase
} from 'lucide-react';

export default function DepartmentStructurePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('CTech');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchStructure() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        }
      } catch (err) {
        console.error('Error fetching department structure:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStructure();
  }, [user]);

  const school = data?.structure?.schools?.[0] || {
    name: 'School of Computing',
    dean: { name: 'Dr. Revathi Venkataraman', designation: 'Dean, School of Computing', email: 'dean.soc@srmist.edu.in' },
    chairperson: { name: 'Dr. C. Lakshmi', designation: 'Chairperson, School of Computing', email: 'chairperson.soc@srmist.edu.in' },
    associateChairperson: { name: 'Dr. M. Pushpalatha', designation: 'Associate Chairperson, School of Computing', email: 'assoc.chairperson.soc@srmist.edu.in' }
  };

  const signatories = data?.signatories || [];

  const deptList = [
    {
      id: 'CTech',
      name: 'Department of Computing Technologies',
      short: 'CTech',
      desc: 'Core Computer Science, Software Architecture, Advanced Systems & Cloud Engineering',
      totalSections: '45 Sections (Sec A – Sec SS)',
      hod: signatories.find(s => s.departmentId === 'CTech' && s.designation?.includes('Head')) || {
        name: 'Dr. M. Murali',
        designation: 'Head of Department, CTech',
        email: 'hod.ctech@srmist.edu.in'
      },
      advisors: signatories.filter(s => s.departmentId === 'CTech' && s.designation?.includes('Academic')) || [],
      facultyAdvisors: signatories.filter(s => s.departmentId === 'CTech' && s.designation?.includes('Faculty Advisor')) || []
    },
    {
      id: 'CIntel',
      name: 'Department of Computational Intelligence',
      short: 'CIntel',
      desc: 'Artificial Intelligence, Machine Learning, Deep Learning, Cognitive Systems & Robotics',
      totalSections: '40 Sections (Sec A – Sec NN)',
      hod: signatories.find(s => s.departmentId === 'CIntel' && s.designation?.includes('Head')) || {
        name: 'Dr. R. Annie Uthra',
        designation: 'Head of Department, CIntel',
        email: 'hod.cintel@srmist.edu.in'
      },
      advisors: signatories.filter(s => s.departmentId === 'CIntel' && s.designation?.includes('Academic')) || [],
      facultyAdvisors: signatories.filter(s => s.departmentId === 'CIntel' && s.designation?.includes('Faculty Advisor')) || []
    },
    {
      id: 'NWC',
      name: 'Department of Networking and Communications',
      short: 'NWC',
      desc: 'Cybersecurity, Cryptography, 5G Wireless Networks, IoT & Embedded Systems',
      totalSections: '35 Sections (Sec A – Sec JJ)',
      hod: signatories.find(s => s.departmentId === 'NWC' && s.designation?.includes('Head')) || {
        name: 'Dr. Annapurani Panaiyappan',
        designation: 'Head of Department, NWC',
        email: 'hod.nwc@srmist.edu.in'
      },
      advisors: signatories.filter(s => s.departmentId === 'NWC' && s.designation?.includes('Academic')) || [],
      facultyAdvisors: signatories.filter(s => s.departmentId === 'NWC' && s.designation?.includes('Faculty Advisor')) || []
    },
    {
      id: 'DSBS',
      name: 'Department of Data Science and Business Systems',
      short: 'DSBS',
      desc: 'Big Data Analytics, Business Intelligence, Data Engineering & Financial Technology',
      totalSections: '35 Sections (Sec A – Sec JJ)',
      hod: signatories.find(s => s.departmentId === 'DSBS' && s.designation?.includes('Head')) || {
        name: 'Dr. G. Vadivu',
        designation: 'Head of Department, DSBS',
        email: 'hod.dsbs@srmist.edu.in'
      },
      advisors: signatories.filter(s => s.departmentId === 'DSBS' && s.designation?.includes('Academic')) || [],
      facultyAdvisors: signatories.filter(s => s.departmentId === 'DSBS' && s.designation?.includes('Faculty Advisor')) || []
    }
  ];

  const currentDept = deptList.find(d => d.id === activeTab) || deptList[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
          <Building2 className="w-3.5 h-3.5" />
          SRM Institute of Science and Technology (KTR)
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">College & Department Hierarchy</h1>
        <p className="text-sm text-slate-500">
          Official institutional directory of School of Computing leadership, departments, Academic Advisors, and Faculty Advisors.
        </p>
      </div>

      {/* School of Computing Apex Leadership */}
      <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 shadow-xs">
        <CardHeader className="pb-3 border-b border-indigo-100/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                School of Computing (SOC) — Apex Directorate
              </CardTitle>
              <CardDescription className="text-xs">
                Governing signatory authorities for academic approvals and high-level student sanctions
              </CardDescription>
            </div>
            <Badge className="bg-indigo-600 text-white font-semibold text-xs">University Directorate</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Dean */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mb-1.5">
                Dean
              </div>
              <div className="font-bold text-sm text-slate-900">
                {school.dean?.name || 'Dr. Revathi Venkataraman'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Dean, School of Computing</div>
              <div className="text-xs text-indigo-600 mt-2 flex items-center gap-1 font-mono">
                <Mail className="w-3 h-3 text-slate-400" />
                {school.dean?.email || 'dean.soc@srmist.edu.in'}
              </div>
            </div>

            {/* Chairperson */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mb-1.5">
                Chairperson
              </div>
              <div className="font-bold text-sm text-slate-900">
                {school.chairperson?.name || 'Dr. C. Lakshmi'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Chairperson, School of Computing</div>
              <div className="text-xs text-indigo-600 mt-2 flex items-center gap-1 font-mono">
                <Mail className="w-3 h-3 text-slate-400" />
                {school.chairperson?.email || 'chairperson.soc@srmist.edu.in'}
              </div>
            </div>

            {/* Associate Chairperson */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mb-1.5">
                Associate Chairperson
              </div>
              <div className="font-bold text-sm text-slate-900">
                {school.associateChairperson?.name || 'Dr. M. Pushpalatha'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Assoc. Chairperson, School of Computing</div>
              <div className="text-xs text-indigo-600 mt-2 flex items-center gap-1 font-mono">
                <Mail className="w-3 h-3 text-slate-400" />
                {school.associateChairperson?.email || 'assoc.chairperson.soc@srmist.edu.in'}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Department Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {deptList.map(dept => (
          <button
            key={dept.id}
            onClick={() => setActiveTab(dept.id)}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === dept.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {dept.short}
          </button>
        ))}
      </div>

      {/* Active Department Overview */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">{currentDept.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{currentDept.desc}</CardDescription>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto text-xs bg-slate-50 border-slate-300">
              {currentDept.totalSections}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* HOD Card */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              Head of Department (HOD)
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">{currentDept.hod.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{currentDept.hod.designation}</div>
              </div>
              <div className="text-xs text-indigo-600 font-mono flex items-center gap-1.5 bg-white px-3 py-1.5 rounded border border-slate-200">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {currentDept.hod.email}
              </div>
            </div>
          </div>

          {/* Academic Advisors (AAs) */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              Academic Advisors (3 – 4 Years Hierarchy)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentDept.advisors.length > 0 ? (
                currentDept.advisors.map((aa, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block mb-1">
                      Academic Advisor
                    </div>
                    <div className="text-xs font-bold text-slate-900">{aa.name}</div>
                    <div className="text-[11px] text-slate-500">{aa.designation}</div>
                    <div className="text-[11px] text-indigo-600 font-mono mt-1.5 truncate">
                      {aa.email}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block mb-1">
                    Academic Advisor (3rd Year)
                  </div>
                  <div className="text-xs font-bold text-slate-900">Dr. A. Rajesh</div>
                  <div className="text-[11px] text-slate-500">Academic Advisor, {currentDept.short}</div>
                  <div className="text-[11px] text-indigo-600 font-mono mt-1.5">
                    aa.{currentDept.id.toLowerCase()}.3rd@srmist.edu.in
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Faculty Advisors (FAs) per section */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Section Faculty Advisors (Mandatory Gatekeepers)
              </span>
              <span className="text-[11px] font-normal text-slate-500">40 – 50 Sections</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentDept.facultyAdvisors.length > 0 ? (
                currentDept.facultyAdvisors.map((fa, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {fa.section || `Section ${String.fromCharCode(65 + i)}`}
                      </span>
                      <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded font-semibold">
                        FA Gatekeeper
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{fa.name}</div>
                    <div className="text-[11px] text-slate-500">{fa.designation}</div>
                    <div className="text-[11px] text-indigo-600 font-mono mt-1.5 truncate">
                      {fa.email}
                    </div>
                  </div>
                ))
              ) : (
                ['Section A', 'Section B', 'Section C'].map((sec, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {sec}
                      </span>
                      <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded font-semibold">
                        FA Gatekeeper
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">Faculty Advisor ({sec})</div>
                    <div className="text-[11px] text-slate-500">Faculty Advisor, {currentDept.short}</div>
                    <div className="text-[11px] text-indigo-600 font-mono mt-1.5 truncate">
                      fa.{currentDept.id.toLowerCase()}.sec{sec.slice(-1)}@srmist.edu.in
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
