import React from 'react';
import { cn } from '../../../../utils/src/lib/cn';

export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("overflow-auto h-full w-full", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ScrollArea.displayName = "ScrollArea";