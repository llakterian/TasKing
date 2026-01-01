
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
    const firestore = getFirestore(app);

    setFirebaseInstances({ app, auth, firestore });
    setLoading(false);
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
