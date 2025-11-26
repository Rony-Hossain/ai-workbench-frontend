import React from 'react';
import { cn } from '../../../../utils/src/lib/cn';

export const Label = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <label
    className={cn(
      'text-[11px] font-medium text-neutral-400 mb-1.5 block tracking-wide',
      className
    )}
  >
    {children}
  </label>
);
