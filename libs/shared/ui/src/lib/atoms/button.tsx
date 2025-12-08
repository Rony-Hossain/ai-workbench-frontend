import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@ai-workbench/shared/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-neutral-950 hover:bg-primary/90 shadow-neon-primary',
        default:
          'bg-primary text-neutral-950 hover:bg-primary/90 shadow-neon-primary',
        secondary:
          'bg-neutral-900 text-neutral-100 hover:bg-neutral-800 border border-neutral-700',
        outline:
          'border border-input bg-transparent text-neutral-100 hover:bg-neutral-900/60',
        ghost:
          'bg-transparent text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60',
        danger:
          'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/40 shadow-neon-danger',
      },
      size: {
        default: 'h-9 px-3 text-sm',
        sm: 'h-8 px-2.5 text-xs',
        lg: 'h-10 px-4 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
