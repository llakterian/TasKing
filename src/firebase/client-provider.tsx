
'use client';
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseConfig } from './config';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
  loading: true,
});

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseClientProvider');
  }
  return context;
};


export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseInstances, setFirebaseInstances] = useState<Omit<FirebaseContextType, 'loading'>>({
    app: null,
    auth: null,
    firestore: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firebaseConfig = getFirebaseConfig();
    if (!firebaseConfig) {
      console.error('Firebase config is not available.');
      setLoading(false);
      return;
    }

    let app: FirebaseApp;
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
      } catch (e) {
        console.error('Failed to initialize Firebase', e);
        setLoading(false); // Stop loading on error
        return;
      }
    } else {
      app = getApp();
    }

    const auth = getAuth(app);
    const { initializeFirestore } = require('firebase/firestore');
    const firestore = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    });

    setFirebaseInstances({ app, auth, firestore });
    setLoading(false);

    // Connectivity Test (Dev Only)
    // This helps debug issues where adblockers might be blocking Firestore requests
    if (process.env.NODE_ENV === 'development') {
      const { doc, getDoc, collection } = require('firebase/firestore');
      // Small delay to ensure network stack is ready
      setTimeout(() => {
        const testRef = doc(collection(firestore, 'connectivity_test'), 'ping');
        getDoc(testRef)
          .then(() => console.log('✅ Firestore connectivity established'))
          .catch((e: any) => {
            console.error('❌ Firestore connectivity failed:', e);
            if (e.code === 'failed-precondition' || e.code === 'unavailable') {
              console.warn('⚠️ This error often indicates an ad-blocker is interfering with Firestore. Please disable ad-blockers for this site.');
            }
          });
      }, 2000);
    }
  }, []);

  const contextValue = useMemo(() => ({
    ...firebaseInstances,
    loading
  }), [firebaseInstances, loading]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};
