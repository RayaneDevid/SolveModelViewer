import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-white/70">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full glass rounded-xl py-2.5 text-sm text-white
              placeholder:text-white/30
              focus:outline-none focus:border-blurple/50 focus:ring-1 focus:ring-blurple/30
              transition-all duration-200
              ${icon ? 'pl-9 pr-4' : 'px-4'}
              ${error ? 'border-red-500/50' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
