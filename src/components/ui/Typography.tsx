import React from 'react';
import { cn } from '../../utils/utils';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h2' | 'h3' | 'section-title' | 'small-caps' | 'mono';
}

export const Typography = ({ 
  className, 
  variant = 'small-caps', 
  ...props 
}: TypographyProps) => {
  const variants = {
    h2: 'text-3xl font-black italic tracking-tighter leading-none',
    h3: 'text-2xl font-black text-slate-800 dark:text-white',
    'section-title': 'font-black text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2',
    'small-caps': 'text-[10px] font-black uppercase tracking-widest',
    mono: 'font-mono font-bold',
  };

  const Component = variant.startsWith('h') ? (variant as keyof JSX.IntrinsicElements) : 'span';

  return (
    <Component
      className={cn(variants[variant], className)}
      {...props}
    />
  );
};
