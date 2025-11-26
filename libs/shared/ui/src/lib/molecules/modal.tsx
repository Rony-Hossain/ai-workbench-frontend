import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../utils/src/lib/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className={cn(
        "relative z-10 w-full max-w-lg bg-neutral-900 border border-neutral-800 shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};