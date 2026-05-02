import React, { createContext, useContext } from 'react';
import type { StoreConfig } from '../types/store';

const StoreContext = createContext<StoreConfig | undefined>(undefined);

export const StoreProvider: React.FC<{ config: StoreConfig; children: React.ReactNode }> = ({
  config,
  children,
}) => {
  return <StoreContext.Provider value={config}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreConfig => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
};
