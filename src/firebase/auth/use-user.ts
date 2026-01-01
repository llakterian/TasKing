'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from './auth';
import type { User } from 'firebase/auth';
import { useFirebase } from '@/firebase';

export const useUser = () => {
  const { auth, loading: firebaseLoading } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseLoading) {
      // Wait for Firebase to initialize
      return;
    }
    
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firebaseLoading]);

  return { user, loading };
};
