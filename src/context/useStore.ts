import { createContext, useContext } from 'react';
import type { StoreConfig } from '../types/store';



export const StoreContext = createContext<StoreConfig | undefined>(undefined);

export const useStore = (): StoreConfig => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
};

