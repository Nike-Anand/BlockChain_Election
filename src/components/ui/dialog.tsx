import React from 'react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative z-50 w-full max-w-lg">
        {children}
        <button
          className="absolute right-6 top-6 z-[60] bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all"
          onClick={() => onOpenChange?.(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function DialogContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`relative ${className}`}>{children}</div>;
}

export function DialogHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex flex-col ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return <h2 className={`font-semibold ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-slate-500 ${className}`}>{children}</p>;
}