import React from 'react';
import { cn } from '../../utils/utils';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn(
      'text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1',
      className
    )}
    {...props}
  />
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-bold focus:ring-4 ring-primary-500/10 outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
