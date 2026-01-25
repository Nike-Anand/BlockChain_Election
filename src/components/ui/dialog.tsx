import React from 'react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg">
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100"
          onClick={() => onOpenChange?.(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function DialogContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5 text-center sm:text-left">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function DialogDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-sm text-slate-500 ${className}`}>{children}</p>;
}