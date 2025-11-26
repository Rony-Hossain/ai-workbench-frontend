import React from 'react';
import { cn } from '../../../../utils/src/lib/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      // Primary: bright cyber accent, strong contrast
      primary:
        'bg-primary text-neutral-950 hover:bg-primary/90 shadow-neon-primary',
      // Secondary: subtle neutral button
      secondary:
        'bg-neutral-900 text-neutral-100 hover:bg-neutral-800 border border-neutral-700',
      // Danger: warning / destructive
      danger:
        'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/40 shadow-neon-danger',
      // Ghost: low emphasis icon/text buttons
      ghost:
        'bg-transparent text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60',
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Density: h-8 (32px), text-xs (12px)
          'inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
