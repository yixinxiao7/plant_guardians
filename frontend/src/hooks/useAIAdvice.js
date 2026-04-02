import { useState, useCallback, useRef } from 'react';
import { ai } from '../utils/api.js';

/**
 * Hook for AI advice text and image flows.
 * Both endpoints return the same response shape.
 */
export function useAIAdvice() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [advice, setAdvice] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setAdvice(null);
    setError(null);
  }, []);

  const getTextAdvice = useCallback(async (plantType) => {
    setStatus('loading');
    setError(null);
    setAdvice(null);
    try {
      const data = await ai.getAdvice({ plant_type: plantType.trim() });
      setAdvice(data);
      setStatus('success');
      return data;
    } catch (err) {
      setError(err);
      setStatus('error');
      throw err;
    }
  }, []);

  const getImageAdvice = useCallback(async (imageFile) => {
    setStatus('loading');
    setError(null);
    setAdvice(null);
    try {
      const data = await ai.identify(imageFile);
      setAdvice(data);
      setStatus('success');
      return data;
    } catch (err) {
      setError(err);
      setStatus('error');
      throw err;
    }
  }, []);

  return {
    status,
    advice,
    error,
    getTextAdvice,
    getImageAdvice,
    reset,
  };
}
