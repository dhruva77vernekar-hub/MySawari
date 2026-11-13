import React from 'react';

export default function Card({
  children,
  className = '',
  hoverEffect = true,
  dark = false,
  ...props
}) {
  return (
    <div
      className={`rounded-[28px] border transition-all duration-300 ${
        dark
          ? 'bg-[#0B0D14] text-white border-white/10'
          : 'bg-white text-[#0A0A14] border-[#DCDAF0] shadow-[0_20px_60px_-20px_rgba(58,77,255,0.12)]'
      } ${
        hoverEffect ? 'hover:-translate-y-1 hover:shadow-[0_25px_70px_-20px_rgba(58,77,255,0.22)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
