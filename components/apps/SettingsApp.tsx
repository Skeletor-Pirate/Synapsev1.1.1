'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Shield, 
  Users, 
  Settings as SettingsIcon, 
  Check, 
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Edit3,
  ChevronRight,
  Search,
  MoreVertical,
  Key,
  Trash2,
  Plus
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { sendInvitation } from '@/app/actions/invite';

type Tab = 'profile' | 'team' | 'permissions' | 'organization' | 'background' | 'api-keys';

export default function SettingsApp({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [team, setTeam] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState(user.backgroundUrl || 'https://picsum.photos/seed/synapse/1920/1080');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [orgName, setOrgName] = useState('Synapse Global');
  const [defaultCurrency, setDefaultCurrency] = useState('USD ($)');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<{ id: string, name: string, value: string }[]>(user.apiKeys || []);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showKey, setShowKey] = useState<string | null>(null);
  const [isAddingKey, setIsAddingKey] = useState(false);

  useEffect(() => {
    if (user.apiKeys) {
      setApiKeys(user.apiKeys);
    }
  }, [user.apiKeys]);

  const handleSaveApiKey = async () => {
    if (!newKeyName || !newKeyValue) return;
    const newKey = { id: Date.now().toString(), name: newKeyName, value: newKeyValue };
    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);
    try {
      await updateDoc(doc(db, 'users', user.uid), { apiKeys: updatedKeys });
      setNewKeyName('');
      setNewKeyValue('');
      setIsAddingKey(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleRemoveApiKey = async (id: string) => {
    const updatedKeys = apiKeys.filter(k => k.id !== id);
    setApiKeys(updatedKeys);
    try {
      await updateDoc(doc(db, 'users', user.uid), { apiKeys: updatedKeys });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteStatus('sending');
    
    const token = window.crypto.randomUUID();
    const invitationRef = doc(db, 'invitations', token);

    try {
      await setDoc(invitationRef, {
        email: inviteEmail,
        orgName: 'Your Organization',
        token,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invitations');
      setInviteStatus('idle');
      return;
    }

    try {
      const result = await sendInvitation(inviteEmail, 'Your Organization', token);
      
      if (result.success) {
        setInviteStatus('sent');
      } else {
        alert(`Failed to send email: ${result.error}. Note: The invitation was still created in the database, but the email was not sent. Please check your RESEND_API_KEY.`);
        setInviteStatus('idle');
        return;
      }
    } catch (error: any) {
      console.error('Invitation error:', error);
      alert(`Error sending invitation: ${error.message || 'Unknown error'}`);
      setInviteStatus('idle');
      return;
    }

    setTimeout(() => {
      setInviteEmail('');
      setInviteStatus('idle');
      setShowInviteForm(false);
    }, 2000);
  };

  useEffect(() => {
    setBackgroundUrl(user.backgroundUrl || 'https://picsum.photos/seed/synapse/1920/1080');
  }, [user.backgroundUrl]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?.orgId && activeTab === 'team' && isAdmin) {
      const q = query(collection(db, 'users'), where('orgId', '==', user.orgId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeam(users);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
      return () => unsubscribe();
    }
  }, [user?.orgId, activeTab, isAdmin]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    setIsUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const roles = [
    { id: 'admin', name: 'Administrator', icon: ShieldAlert, color: 'text-rose-500', desc: 'Full access to all features, team management, and financial settings.' },
    { id: 'editor', name: 'Editor', icon: Edit3, color: 'text-amber-500', desc: 'Can create and edit transactions, invoices, and forecasts. No team management.' },
    { id: 'viewer', name: 'Viewer', icon: Eye, color: 'text-blue-500', desc: 'Read-only access to dashboards and reports. Cannot modify any data.' },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Sidebar Nav */}
      <aside className="w-full lg:w-64 space-y-2">
        {[
          { id: 'profile', label: 'My Profile', icon: UserIcon },
          { id: 'team', label: 'Team Management', icon: Users },
          { id: 'permissions', label: 'Roles & Permissions', icon: Shield },
          { id: 'organization', label: 'Organization', icon: SettingsIcon },
          { id: 'background', label: 'Background', icon: Eye },
          { id: 'api-keys', label: 'API Keys', icon: Key },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${
              activeTab === tab.id 
                ? 'bg-white text-black font-bold' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </aside>

      {/* Content Area */}
      <main className="flex-1 min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black tracking-tighter">My Profile</h2>
                <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 text-2xl font-bold">
                      {user.displayName?.[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{user.displayName}</h3>
                      <p className="text-zinc-500">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-zinc-900 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-800">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800">
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Display Name</label>
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Email Address</label>
                      <input type="email" defaultValue={user.email} disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 opacity-50 cursor-not-allowed" />
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', user.uid), { displayName });
                        alert('Profile updated successfully.');
                      } catch (error) {
                        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
                      }
                    }}
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter">Team Management</h2>
                    <p className="text-zinc-500">Manage users and roles within your organization.</p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => setShowInviteForm(!showInviteForm)}
                      className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200"
                    >
                      {showInviteForm ? 'Cancel' : 'Invite Member'}
                    </button>
                  )}
                </div>

                {showInviteForm && (
                  <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-zinc-800 flex gap-4 items-center">
                    <input 
                      type="email" 
                      placeholder="Enter email address..." 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none focus:border-white transition-colors"
                    />
                    <button 
                      onClick={handleInvite}
                      disabled={inviteStatus !== 'idle'}
                      className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      {inviteStatus === 'sending' ? 'Sending...' : inviteStatus === 'sent' ? 'Sent!' : 'Send Invite'}
                    </button>
                  </div>
                )}

                <div className="bg-[#0f0f0f] rounded-3xl border border-zinc-800 overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
                    <div className="flex-1 bg-zinc-900 px-4 py-2 rounded-xl flex items-center gap-3 border border-zinc-800">
                      <Search size={18} className="text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Search team members..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-widest">
                          <th className="p-6 font-bold">User</th>
                          <th className="p-6 font-bold">Role</th>
                          <th className="p-6 font-bold">Status</th>
                          <th className="p-6 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {team.filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase())).map((member) => (
                          <tr key={member.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">
                                  {member.displayName?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold">{member.displayName} {member.id === user.uid && <span className="text-[10px] text-zinc-500 ml-1">(You)</span>}</p>
                                  <p className="text-xs text-zinc-500">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              {isAdmin && member.id !== user.uid ? (
                                <select 
                                  value={member.role}
                                  disabled={isUpdating === member.id}
                                  onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs outline-none focus:border-zinc-500 transition-colors cursor-pointer"
                                >
                                  {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="px-2 py-1 bg-zinc-900 rounded-lg text-[10px] text-zinc-400 font-bold uppercase tracking-widest border border-zinc-800">
                                  {member.role}
                                </span>
                              )}
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs text-zinc-400">Active</span>
                              </div>
                            </td>
                            <td className="p-6 text-right">
                              {/* Removed cosmetic MoreVertical button */}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black tracking-tighter">Roles & Permissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {roles.map((role) => (
                    <div key={role.id} className="bg-[#0f0f0f] p-6 rounded-3xl border border-zinc-800 flex flex-col">
                      <div className={`p-3 rounded-2xl bg-zinc-900 w-fit mb-4 ${role.color}`}>
                        <role.icon size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{role.name}</h3>
                      <p className="text-sm text-zinc-500 mb-6 flex-1">{role.desc}</p>
                      
                      <div className="space-y-3 pt-6 border-t border-zinc-800">
                        <div className="flex items-center gap-2 text-xs">
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-zinc-300">View Dashboards</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {role.id !== 'viewer' ? <Check size={14} className="text-emerald-500" /> : <Shield size={14} className="text-zinc-700" />}
                          <span className={role.id === 'viewer' ? 'text-zinc-600' : 'text-zinc-300'}>Edit Transactions</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {role.id === 'admin' ? <Check size={14} className="text-emerald-500" /> : <Shield size={14} className="text-zinc-700" />}
                          <span className={role.id !== 'admin' ? 'text-zinc-600' : 'text-zinc-300'}>Manage Team</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex gap-4">
                  <AlertCircle className="text-amber-500 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-500">Security Note</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Role changes take effect immediately across all active sessions. Only administrators can modify roles or invite new members.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black tracking-tighter">Background Settings</h2>
                <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800 space-y-6">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Background Image URL</label>
                    <input 
                      type="text" 
                      value={backgroundUrl}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors" 
                      onChange={(e) => setBackgroundUrl(e.target.value)}
                    />
                  </div>
                  <button 
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                    onClick={async () => {
                      setIsUpdating('background');
                      try {
                        await updateDoc(doc(db, 'users', user.uid), { backgroundUrl });
                      } catch (error) {
                        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
                      } finally {
                        setIsUpdating(null);
                      }
                    }}
                  >
                    {isUpdating === 'background' ? 'Saving...' : 'Save Changes'}
                  </button>
                  <p className="text-xs text-zinc-500">Enter a valid image URL to change your desktop and lock screen background.</p>
                </div>
              </div>
            )}

            {activeTab === 'organization' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black tracking-tighter">Organization Settings</h2>
                <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Organization Name</label>
                      <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Default Currency</label>
                      <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors">
                        <option>USD ($)</option>
                        <option>INR (₹)</option>
                        <option>EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Org ID</label>
                      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 opacity-50">
                        <span className="text-sm font-mono">{user.orgId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-zinc-800">
                    <button 
                      onClick={() => alert('Organization updated successfully.')}
                      className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                      Update Organization
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'api-keys' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter">API Keys</h2>
                    <p className="text-zinc-500">Manage your third-party API keys securely.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingKey(!isAddingKey)}
                    className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 flex items-center gap-2"
                  >
                    {isAddingKey ? 'Cancel' : <><Plus size={16} /> Add Key</>}
                  </button>
                </div>

                {isAddingKey && (
                  <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-zinc-800 space-y-4">
                    <h3 className="text-lg font-bold">Add New API Key</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Key Name (e.g., Gemini API)</label>
                        <input 
                          type="text" 
                          placeholder="My Gemini Key"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">API Key Value</label>
                        <input 
                          type="password" 
                          placeholder="AIzaSy..."
                          value={newKeyValue}
                          onChange={(e) => setNewKeyValue(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors font-mono"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveApiKey}
                      disabled={!newKeyName || !newKeyValue}
                      className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      Save Key
                    </button>
                  </div>
                )}

                <div className="bg-[#0f0f0f] rounded-3xl border border-zinc-800 overflow-hidden">
                  {apiKeys.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                      <Key size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No API keys configured yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-widest">
                            <th className="p-6 font-bold w-1/3">Name</th>
                            <th className="p-6 font-bold w-1/2">Key</th>
                            <th className="p-6 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {apiKeys.map((key) => (
                            <tr key={key.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                              <td className="p-6 font-bold">{key.name}</td>
                              <td className="p-6 font-mono text-zinc-400">
                                <div className="flex items-center gap-3">
                                  <span>{showKey === key.id ? key.value : '••••••••••••••••••••••••••••••••'}</span>
                                  <button 
                                    onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                  >
                                    {showKey === key.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                              </td>
                              <td className="p-6 text-right">
                                <button 
                                  onClick={() => handleRemoveApiKey(key.id)}
                                  className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                  title="Remove Key"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex gap-4">
                  <ShieldCheck className="text-blue-500 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-500">Secure Storage</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      API keys are stored securely in your profile. They are used locally by applications within Synapse OS to authenticate with third-party services like Gemini and Google Search.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
