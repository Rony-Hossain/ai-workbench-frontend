import React from 'react';

/**
 * WorkbenchProvider
 * Currently a passthrough, but critical for future Context injection
 * (e.g. if we move away from global Zustand or need SSR hydration)
 */
export const WorkbenchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};
