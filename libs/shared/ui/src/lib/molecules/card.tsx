import React from 'react';
import { cn } from '../../../../utils/src/lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative border border-neutral-800 p-4',
          glass 
            ? 'bg-neutral-900/60 backdrop-blur-md shadow-glass' 
            : 'bg-neutral-900',
          hoverEffect && 'hover:border-neutral-700 transition-colors duration-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";