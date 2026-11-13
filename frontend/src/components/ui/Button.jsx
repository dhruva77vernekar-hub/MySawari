import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'amber' | 'danger' | 'ghost'
  size = 'md',
  showArrow = false,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#0A0A14] hover:bg-[#3A4DFF] text-white shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(58,77,255,0.4)]',
    secondary: 'bg-white hover:bg-[#F1F0FA] text-[#0A0A14] border border-[#DCDAF0]',
    amber: 'bg-[#FFC21A] hover:bg-[#e6ad12] text-[#0A0A14] font-semibold shadow-md',
    danger: 'bg-[#EF2B3E] hover:bg-[#d61e30] text-white',
    ghost: 'bg-transparent hover:bg-black/5 text-[#0A0A14]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {showArrow && (
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      )}
    </button>
  );
}
