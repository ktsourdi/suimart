import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading = false, glow = false, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';
    
    const variantClasses: Record<string, string> = {
      primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
      secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 hover:from-gray-200 hover:to-gray-300 focus:ring-gray-500 shadow-md hover:shadow-lg',
      outline: 'bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500 shadow-sm hover:shadow-md',
      ghost: 'bg-transparent text-gray-600 border border-transparent hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
      gradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white border-0 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 focus:ring-purple-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
      glass: 'backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:ring-white/50 shadow-lg hover:shadow-xl'
    };
    
    const sizeClasses: Record<string, string> = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
      xl: 'px-10 py-5 text-lg'
    };
    
    const glowClasses = glow ? 'button-glow' : '';
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${glowClasses} ${className}`;
    
    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;