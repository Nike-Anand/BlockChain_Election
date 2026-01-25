import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'ghost' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900'
  };

  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-8'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}