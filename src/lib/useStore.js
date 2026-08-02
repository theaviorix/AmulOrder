import { useEffect, useState } from 'react';
import { store } from './store';

export function useStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => (t + 1) % 1000000);
    window.addEventListener('amul-store-change', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('amul-store-change', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);
  return store;
}