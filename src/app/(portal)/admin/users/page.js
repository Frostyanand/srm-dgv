"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, KeySquare, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [provisionedUser, setProvisionedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SIGNATORY',
    departmentId: ''
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ email: '' });
  const [editFormError, setEditFormError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [resetPasswordOutput, setResetPasswordOutput] = useState('');

  // Filter and Sort State
  const [showDeactivated, setShowDeactivated] = useState(false);

  const fetchUsers = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  // Derived sorted and filtered users
  const roleOrder = { SUPER_ADMIN: 1, SIGNATORY: 2, DEPARTMENT_USER: 3 };
  
  const displayUsers = users
    .filter(u => showDeactivated ? true : u.status === 'ACTIVE')
    .sort((a, b) => {
      // Sort by role first
      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
      }
      // Then alphabetically by name
      return a.name.localeCompare(b.name);
    });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setProvisionedUser(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Success
      setProvisionedUser({
        email: formData.email,
        password: data.tempPassword
      });
      
      fetchUsers(); // Refresh the table
      setFormData({ name: '', email: '', role: 'SIGNATORY', departmentId: '' }); // Reset form
      
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditFormData({ email: u.email });
    setEditFormError('');
    setResetPasswordOutput('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUserAction = async (action, additionalData = {}) => {
    setIsUpdating(true);
    setEditFormError('');
    setResetPasswordOutput('');

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, ...additionalData })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);

      if (action === 'RESET_PASSWORD') {
        setResetPasswordOutput(data.tempPassword);
      } else {
        if (action === 'DEACTIVATE') {
          setIsEditModalOpen(false);
        } else if (action === 'UPDATE_EMAIL') {
          setEditingUser({ ...editingUser, email: editFormData.email });
          setEditFormError('Email updated successfully.');
        }
      }
      
      fetchUsers();
    } catch (error) {
      setEditFormError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="text-slate-500 p-8 text-center">Loading users...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage institution users and their roles</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="text-sm font-medium text-slate-700">All Accounts</div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
              Show Deactivated Users
            </span>
          </label>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((u) => (
                <TableRow key={u.id} className={u.status === 'INACTIVE' ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>{u.departmentId || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              {displayUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {users.length > 0 ? "No users match the current filters." : "No users found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Provision New User
              </h2>
              <button 
                onClick={() => { setIsModalOpen(false); setProvisionedUser(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {provisionedUser ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                    <h3 className="font-medium mb-1 text-emerald-900">User Successfully Created!</h3>
                    <p className="text-sm">Please securely share the following temporary credentials with the user. They will not be shown again.</p>
                  </div>
                  
                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                      <div className="font-mono text-sm text-slate-900 mt-1">{provisionedUser.email}</div>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temporary Password</span>
                      <div className="font-mono text-sm text-slate-900 mt-1 flex items-center gap-2">
                        <KeySquare className="w-4 h-4 text-slate-400" />
                        {provisionedUser.password}
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-4" onClick={() => { setIsModalOpen(false); setProvisionedUser(null); }}>
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleCreateUser} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded text-sm">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value, departmentId: ''})}
                    >
                      <option value="SIGNATORY">Signatory (Can Approve)</option>
                      <option value="DEPARTMENT_USER">Department User (Can Upload)</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>

                  {formData.role === 'DEPARTMENT_USER' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Academics, CS, EC"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.departmentId}
                        onChange={e => setFormData({...formData, departmentId: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {formData.role === 'DEPARTMENT_USER' ? 'Person Name' : 'Full Name'}
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder={formData.role === 'DEPARTMENT_USER' ? "e.g. Dr. John Doe" : "e.g. Jane Smith"}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      placeholder="name@srmist.edu.in"
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Provisioning...</>
                      ) : (
                        'Provision Account'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Overlay */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">
                Edit User: {editingUser.name}
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {editFormError && (
                <div className={`p-3 border rounded text-sm ${editFormError.includes('successfully') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                  {editFormError}
                </div>
              )}

              {/* Email Update Form */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={editFormData.email}
                    onChange={e => setEditFormData({ email: e.target.value })}
                    disabled={editingUser.status === 'INACTIVE'}
                  />
                  <Button 
                    variant="secondary" 
                    onClick={() => handleUpdateUserAction('UPDATE_EMAIL', { email: editFormData.email })}
                    disabled={isUpdating || editingUser.status === 'INACTIVE' || editFormData.email === editingUser.email}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Administrative Actions</h3>
                
                {editingUser.status === 'ACTIVE' && (
                  <>
                    <div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleUpdateUserAction('RESET_PASSWORD')}
                        disabled={isUpdating}
                      >
                        <KeySquare className="w-4 h-4 mr-2 text-indigo-500" />
                        Generate New Temporary Password
                      </Button>
                      <p className="text-xs text-slate-500 mt-1">
                        Forces the user to change their password on next login.
                      </p>
                      
                      {resetPasswordOutput && (
                        <div className="mt-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Temporary Password</span>
                          <div className="font-mono text-sm text-slate-900 mt-1">{resetPasswordOutput}</div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button 
                        variant="destructive" 
                        className="w-full justify-start"
                        onClick={() => {
                          if (confirm(`Are you sure you want to deactivate ${editingUser.name}? They will no longer be able to log in.`)) {
                            handleUpdateUserAction('DEACTIVATE');
                          }
                        }}
                        disabled={isUpdating || editingUser.id === user.uid}
                      >
                        Deactivate User Account
                      </Button>
                      <p className="text-xs text-slate-500 mt-1">
                        {editingUser.id === user.uid 
                          ? "You cannot deactivate your own active session." 
                          : "Disables access but preserves cryptographic audit records."}
                      </p>
                    </div>
                  </>
                )}
                
                {editingUser.status === 'INACTIVE' && (
                  <div className="p-3 bg-slate-100 text-slate-600 rounded text-sm text-center">
                    This account is permanently deactivated.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
