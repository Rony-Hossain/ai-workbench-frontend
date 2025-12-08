import React from 'react';
import { cn } from '@ai-workbench/shared/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        // Density: h-8, text-xs
        'flex h-8 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs shadow-sm transition-colors',
        'file:border-0 file:bg-transparent file:text-xs file:font-medium',
        'placeholder:text-neutral-500 text-neutral-200',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
