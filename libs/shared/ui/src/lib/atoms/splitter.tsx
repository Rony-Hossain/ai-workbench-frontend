import { PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '../../../../utils/src/lib/cn';

interface SplitterProps {
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

export function Splitter({ className, direction = 'horizontal' }: SplitterProps) {
  return (
    <PanelResizeHandle
    //   className={cn(
    //     'group flex items-center justify-center bg-neutral-900 transition-colors hover:bg-primary/20 focus:outline-none z-10',
    //     direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
    //     className
    //   )}
    >
      {/* The visible "Grip" line - Sharp & Thin */}
      {/* <div
        className={cn(
          'bg-neutral-800 transition-colors group-hover:bg-primary shadow-sm',
          direction === 'horizontal' ? 'h-8 w-[1px]' : 'h-[1px] w-8'
        )}
      /> */}
    </PanelResizeHandle>
  );
}