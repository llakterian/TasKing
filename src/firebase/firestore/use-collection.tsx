'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, CollectionReference } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

interface UseCollectionOptions {
  dependencies?: any[];
}

export function useCollection<T>(
  ref: Query | CollectionReference | null,
  options?: UseCollectionOptions
) {
  const { firestore } = useFirebase();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const dependencies = options?.dependencies || [];

  // Create a string representation of the ref to use as a dependency
  // This is a common pattern to avoid re-running the effect when the ref object changes but the query is the same
  const refString = ref ? ('path' in ref ? ref.path : ref.toString()) : null;

  useEffect(() => {
    if (!firestore || !ref) {
      setData(null);
      setLoading(false);
      return;
    };

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching collection: ", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, refString, ...dependencies]);

  return { data, loading, error };
}
