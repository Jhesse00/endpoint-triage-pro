import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-cyan-400/60 bg-cyan-400 text-slate-950 hover:bg-cyan-300 focus:ring-cyan-400/40',
  secondary: 'border-slate-700 bg-slate-800 text-slate-100 hover:border-slate-600 hover:bg-slate-700 focus:ring-slate-500/30',
  ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-slate-800/70 hover:text-slate-100 focus:ring-slate-500/20',
  danger: 'border-red-400/50 bg-red-500/10 text-red-200 hover:bg-red-500/20 focus:ring-red-400/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

export function Button({ children, className = '', variant = 'secondary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-sm border font-semibold tracking-wide transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
