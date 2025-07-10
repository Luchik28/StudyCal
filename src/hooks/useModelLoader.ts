'use client';

import { useEffect, useState } from 'react';
import { loadClassificationModel } from '@/utils/eventClassification';

export function useModelLoader() {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await loadClassificationModel();
        setIsModelLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Failed to load TensorFlow model:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsModelLoaded(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  return { isModelLoaded, isLoading, error };
}
