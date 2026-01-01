'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

interface UseDocOptions<T> {
  dependencies?: any[];
}

export function useDoc<T>(
  ref: DocumentReference | null,
  options?: UseDocOptions<T>
) {
  const { firestore } = useFirebase();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const dependencies = options?.dependencies || [];

  useEffect(() => {
    if (!firestore || !ref) {
      if (!ref) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching document: ", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, ...dependencies]);

  return { data, loading, error };
}
