"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldAlert, 
  KeyRound, 
  Loader2, 
  X, 
  GraduationCap, 
  Building2, 
  Sparkles, 
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { updatePassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Portal Tab: 'STAFF' (Faculty/Signatory/Admin) vs 'STUDENT'
  const [portalType, setPortalType] = useState('STAFF');
  const [isStudentRegister, setIsStudentRegister] = useState(false);
  
  // Student Registration state
  const [studentName, setStudentName] = useState('');
  const [studentDept, setStudentDept] = useState('CTech');
  const [studentSection, setStudentSection] = useState('Section A');
  const [studentYear, setStudentYear] = useState('3rd Year');

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  
  const { user, login, loginWithGoogle, logout } = useAuth();
  const router = useRouter();

  const handleRouteByRole = (userRole) => {
    if (userRole === 'SUPER_ADMIN') router.push('/admin');
    else if (userRole === 'DEPARTMENT_USER') router.push('/department');
    else if (userRole === 'SIGNATORY') router.push('/signatory');
    else if (userRole === 'STUDENT') router.push('/student');
    else throw new Error("Unauthorized role");
  };

  const checkMFAAndRoute = async (currentUser, userRole) => {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/mfa/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mfaEnabled) {
          router.push('/mfa/verify');
          return;
        }
      }
      handleRouteByRole(userRole);
    } catch (err) {
      handleRouteByRole(userRole);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user: loggedInUser, role, requiresReset } = await login(email, password);
      if (requiresReset) {
        setPendingRole(role);
        setShowResetModal(true);
      } else {
        await checkMFAAndRoute(loggedInUser, role);
      }
    } catch (err) {
      if (err.message === "UNAUTHORIZED_ACCOUNT") {
        setError('Account not provisioned or lacks institutional role. Please register or contact admin.');
      } else {
        setError('Invalid credentials or unauthorized access.');
      }
      console.error(err);
      setLoading(false);
    }
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/student-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          email,
          password,
          departmentId: studentDept,
          section: studentSection,
          year: studentYear
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register student account.');
      }

      // Automatically sign in the freshly provisioned student
      const { user: loggedInUser, role } = await login(email, password);
      await checkMFAAndRoute(loggedInUser, role);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    signInWithPopup(auth, provider)
      .then(async (userCredential) => {
        setLoading(true);
        setError('');
        
        try {
          const { user: loggedInUser, role, requiresReset } = await loginWithGoogle(userCredential);
          if (requiresReset) {
            setPendingRole(role);
            setShowResetModal(true);
          } else {
            await checkMFAAndRoute(loggedInUser, role);
          }
        } catch (err) {
          setLoading(false);
          if (err.message === "UNAUTHORIZED_ACCOUNT") {
            setError('Unauthorized: Your Google account has not been provisioned by an administrator.');
          } else {
            setError('Failed to log in with Google. Please try again.');
          }
          console.error(err);
        }
      })
      .catch((err) => {
        setLoading(false);
        if (err.code === 'auth/popup-blocked') {
          setError('Popup blocked! Please check your adblocker or click "Allow popups".');
        } else if (err.code === 'auth/account-exists-with-different-credential') {
          setError('An account already exists with this email. Please sign in with your Email and Password.');
        } else {
          setError('Failed to log in with Google. Please try again.');
        }
        console.error('Google Login Error:', err);
      });
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setResetError('Passwords do not match');
    }
    if (newPassword.length < 8) {
      return setResetError('Password must be at least 8 characters long');
    }

    setResetLoading(true);
    setResetError('');

    try {
      await updatePassword(user, newPassword);

      const token = await user.getIdToken();
      const res = await fetch('/api/auth/clear-reset-claim', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to verify password update. Please contact support.');
      }

      await user.getIdToken(true);
      setShowResetModal(false);
      await checkMFAAndRoute(user, pendingRole);
    } catch (err) {
      setResetError(err.message || 'An error occurred while updating your password.');
    } finally {
      setResetLoading(false);
    }
  };

  const cancelPasswordReset = async () => {
    await logout();
    setShowResetModal(false);
    setPendingRole(null);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  // Quick Demo Accounts for Hackathon presentation
  const demoAccounts = [
    { label: 'Dean, Computing', email: 'dean.soc@srmist.edu.in', type: 'STAFF' },
    { label: 'HOD, CTech', email: 'hod.ctech@srmist.edu.in', type: 'STAFF' },
    { label: 'Academic Advisor (3rd Yr)', email: 'aa.ctech.3rd@srmist.edu.in', type: 'STAFF' },
    { label: 'Faculty Advisor (Sec A)', email: 'fa.ctech.secA@srmist.edu.in', type: 'STAFF' },
    { label: 'Student (Rahul, Sec A)', email: 'rahul.ctech@srmist.edu.in', type: 'STUDENT' },
    { label: 'Super Administrator', email: 'superadmin@srmist.edu.in', type: 'STAFF', pass: 'SRM#SecureAdmin2026!' },
  ];

  const quickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass || 'SRM#2026Demo');
    setPortalType(acc.type);
    setIsStudentRegister(false);
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-zinc-900 font-sans selection:bg-indigo-100">
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        
        <div className="w-full max-w-[440px]">
          
          <div className="mb-6 flex flex-col items-center text-center">
            <Link href="/" className="flex items-center gap-3 font-bold tracking-tight text-xl mb-4 hover:opacity-90 transition-opacity">
              <Image src="/image.png" alt="SRM Logo" width={38} height={38} className="object-contain" />
              <span className="text-slate-900">SRM IST</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Digital Document Verification</h1>
            <p className="text-xs text-slate-500 mt-1">School of Computing • Cryptographic Institutional Approvals</p>
          </div>

          {/* Quick Demo Selector for Presentation */}
          <div className="mb-4 bg-indigo-50/80 border border-indigo-200/70 rounded-lg p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Hackathon Demo Quick-Switch
              </span>
              <span className="text-[10px] bg-indigo-200/60 px-1.5 py-0.5 rounded text-indigo-800">1-Click Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {demoAccounts.map((acc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => quickFill(acc)}
                  className="text-left px-2 py-1.5 bg-white hover:bg-indigo-100/70 border border-indigo-100 rounded text-slate-700 hover:text-indigo-900 transition-colors text-[11px] truncate flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                  <span className="truncate">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-7">
            
            {/* Tab selection */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-md mb-6 text-sm font-medium">
              <button
                type="button"
                onClick={() => { setPortalType('STAFF'); setIsStudentRegister(false); setError(''); }}
                className={`py-2 rounded flex items-center justify-center gap-2 transition-all ${
                  portalType === 'STAFF' 
                    ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Faculty & Staff
              </button>
              <button
                type="button"
                onClick={() => { setPortalType('STUDENT'); setError(''); }}
                className={`py-2 rounded flex items-center justify-center gap-2 transition-all ${
                  portalType === 'STUDENT' 
                    ? 'bg-white text-indigo-600 shadow-xs font-semibold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Portal
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-md">
                {error}
              </div>
            )}

            {/* Standard Login Form */}
            {(!isStudentRegister || portalType === 'STAFF') ? (
              <form onSubmit={handleLogin} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="email">
                    {portalType === 'STAFF' ? 'Institutional Email' : 'Student Email'}
                  </label>
                  <input 
                    id="email" 
                    type="email" 
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-shadow"
                    placeholder={portalType === 'STAFF' ? "faculty@srmist.edu.in" : "student@srmist.edu.in"} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <input 
                    id="password" 
                    type="password" 
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-shadow"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-10 mt-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Authenticating...' : (portalType === 'STAFF' ? 'Sign in as Faculty / Signatory' : 'Enter Student Portal')}
                </button>

                {portalType === 'STUDENT' && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsStudentRegister(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      New student without account? Register here
                    </button>
                  </div>
                )}
              </form>
            ) : (
              /* Student Self-Registration Form */
              <form onSubmit={handleStudentRegister} className="space-y-3.5">
                <div className="border-b pb-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-900">Student Instant Onboarding</h3>
                  <p className="text-[11px] text-slate-500">Auto-assigns your section Faculty Advisor (FA) gatekeeper.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm"
                    placeholder="e.g. Rahul Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Student SRM Email</label>
                  <input 
                    type="email" 
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm"
                    placeholder="name.student@srmist.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Department</label>
                    <select
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-md text-xs font-medium"
                      value={studentDept}
                      onChange={(e) => setStudentDept(e.target.value)}
                    >
                      <option value="CTech">CTech (Computing Tech)</option>
                      <option value="CIntel">CIntel (Comp Intelligence)</option>
                      <option value="NWC">NWC (Networks & Comm)</option>
                      <option value="DSBS">DSBS (Data Science)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Section</label>
                    <select
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-md text-xs font-medium"
                      value={studentSection}
                      onChange={(e) => setStudentSection(e.target.value)}
                    >
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                      <option value="Section C">Section C</option>
                      <option value="Section D">Section D</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Academic Year</label>
                    <select
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-md text-xs font-medium"
                      value={studentYear}
                      onChange={(e) => setStudentYear(e.target.value)}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year">Final Year</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <input 
                      type="password" 
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-10 mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Creating Student Credentials...' : 'Register & Enter Student Portal'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsStudentRegister(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Already registered? Back to Sign In
                  </button>
                </div>
              </form>
            )}

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400">Institutional SSO</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-9.5 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors disabled:opacity-50 shadow-xs gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              SRM Google Workspace SSO
            </button>
          </div>

        </div>

      </div>

      {/* Force Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Security Action Required
              </h2>
              <button 
                onClick={cancelPasswordReset}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs text-slate-600 mb-5">
                You are logging in with a temporary password. Please set your permanent security password before proceeding.
              </p>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded text-xs font-medium">
                    {resetError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-5">
                  <button 
                    type="button" 
                    onClick={cancelPasswordReset}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={resetLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center"
                  >
                    {resetLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Updating...</>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
