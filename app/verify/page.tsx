'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth, googleProvider, signInWithPopup, onAuthStateChanged } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'unauthenticated'>('verifying');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setStatus('unauthenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setStatus('verifying');
    } catch (error) {
      console.error('Sign in error:', error);
      setMessage('Failed to sign in. Please try again.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    if (!user) return;

    async function verify() {
      try {
        const invitationRef = doc(db, 'invitations', token!);
        const invitationSnap = await getDoc(invitationRef);

        if (!invitationSnap.exists()) {
          setStatus('error');
          setMessage('Invitation not found or already used.');
          return;
        }

        const invitationData = invitationSnap.data();
        
        // Check if the logged in user's email matches the invitation email
        if (invitationData.email.toLowerCase() !== user?.email?.toLowerCase()) {
          setStatus('error');
          setMessage(`This invitation was sent to ${invitationData.email}, but you are logged in as ${user?.email}.`);
          return;
        }

        if (invitationData.status === 'active') {
          setStatus('error');
          setMessage('Invitation already used.');
          return;
        }

        await updateDoc(invitationRef, { status: 'active' });
        
        // Update the user's profile with the orgId from the invitation
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          await updateDoc(userDocRef, { orgId: invitationData.orgId });
        } else {
          // If profile doesn't exist yet, create it
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'editor', // Invited users are editors by default
            orgId: invitationData.orgId,
            createdAt: new Date().toISOString()
          });
          // Seed initial data for the organization if it's new? 
          // Usually invitations are to existing orgs, so seeding might not be needed.
        }
        
        setStatus('success');
        setMessage('Your email has been verified! Redirecting to Synapse OS...');
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    }

    verify();
  }, [token, router, user]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md p-8 bg-zinc-900 rounded-[32px] border border-zinc-800 text-center shadow-2xl">
        <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl rotate-6">
          <div className="grid grid-cols-2 gap-0.5 p-1">
            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
            <div className="w-3 h-3 bg-amber-500 rounded-sm" />
            <div className="w-3 h-3 bg-rose-500 rounded-sm" />
          </div>
        </div>
        
        <h1 className="text-2xl font-black tracking-tighter mb-2">Verify Invitation</h1>
        
        {status === 'unauthenticated' && (
          <div className="space-y-6">
            <p className="text-zinc-400 text-sm">Please sign in with your Google account to verify your invitation.</p>
            <button 
              onClick={handleSignIn}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95"
            >
              Continue with Google
            </button>
          </div>
        )}

        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm">Verifying your invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <p className="text-emerald-500 font-bold">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <p className="text-rose-500 font-medium text-sm">{message}</p>
            <button 
              onClick={() => router.push('/')}
              className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mt-4"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyInvitation() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
