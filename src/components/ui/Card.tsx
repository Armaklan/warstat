import React from 'react';
import { cn } from '../../utils/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'glass';
}

export const Card = ({ className, variant = 'default', ...props }: CardProps) => {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl',
    dark: 'bg-slate-900 dark:bg-slate-900 text-white border border-slate-800 shadow-2xl rounded-3xl overflow-hidden relative',
    glass: 'bg-white/5 border border-white/5 rounded-2xl',
  };

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    />
  );
};
