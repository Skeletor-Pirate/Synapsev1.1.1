import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export const logUserLogin = async (userId: string, email: string | null) => {
  try {
    await addDoc(collection(db, 'user_logins'), {
      userId,
      email,
      timestamp: serverTimestamp(),
      event: 'login'
    });
  } catch (error) {
    console.error('Failed to log user login:', error);
  }
};

export const logAppUsage = async (userId: string, appId: string, durationMs: number) => {
  try {
    await addDoc(collection(db, 'app_usage'), {
      userId,
      appId,
      durationMs,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log app usage:', error);
  }
};

export const syncUserAction = async (userId: string, actionType: string, details: any) => {
  try {
    await addDoc(collection(db, 'realtime_actions'), {
      userId,
      actionType,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to sync user action:', error);
  }
};
