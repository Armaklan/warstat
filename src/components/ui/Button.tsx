import React from 'react';
import { cn } from '../../utils/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  as?: any;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', as: Component = 'button', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/20 active:scale-[0.98]',
      secondary: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm',
      ghost: 'text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors',
      outline: 'border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-primary-500 hover:text-primary-600 transition-all',
      danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors',
    };

    const sizes = {
      sm: 'px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full',
      md: 'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest',
      lg: 'py-5 px-8 rounded-2xl font-black text-lg',
      icon: 'p-2 rounded-xl',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
