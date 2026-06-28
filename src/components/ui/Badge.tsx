import React from 'react';
import { cn } from '../../utils/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'danger' | 'neutral' | 'outline';
}

export const Badge = ({ className, variant = 'neutral', ...props }: BadgeProps) => {
  const variants = {
    success: 'bg-green-500/20 text-green-400',
    danger: 'bg-red-500/20 text-red-400',
    neutral: 'bg-slate-700 text-slate-300',
    outline: 'border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400',
  };

  return (
    <div
      className={cn(
        'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
