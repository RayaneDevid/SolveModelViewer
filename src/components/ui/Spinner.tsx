interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`
        border-2 border-white/10 border-t-blurple rounded-full animate-spin
        ${sizeClasses[size]}
        ${className}
      `}
    />
  );
}
