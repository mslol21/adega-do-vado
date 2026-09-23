import { StoreContext } from './useStore';
import React from 'react';
import type { StoreConfig } from '../types/store';

export const StoreProvider: React.FC<{ config: StoreConfig; children: React.ReactNode }> = ({
  config,
  children,
}) => {
  return <StoreContext.Provider value={config}>{children}</StoreContext.Provider>;
};
