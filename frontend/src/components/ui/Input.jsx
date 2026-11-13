import React from 'react';

export default function Input({
  label,
  error,
  icon: Icon,
  rightElement,
  className = '',
  ...props
}) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-[#5B5B73] uppercase tracking-wider pl-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-[#5B5B73] pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          className={`w-full h-14 bg-white text-[#0A0A14] text-sm font-medium rounded-[16px] border border-[#DCDAF0] ${
            Icon ? 'pl-12' : 'pl-4'
          } ${rightElement ? 'pr-12' : 'pr-4'} outline-none transition-all focus:border-[#3A4DFF] focus:ring-2 focus:ring-[#3A4DFF]/15 placeholder:text-[#8E96A6] ${
            error ? 'border-[#EF2B3E] focus:border-[#EF2B3E] focus:ring-[#EF2B3E]/15' : ''
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#EF2B3E] pl-1 font-medium">{error}</p>}
    </div>
  );
}
