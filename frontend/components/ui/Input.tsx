import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'glass' | 'outline';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, variant = 'default', ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500/20',
      glass: 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:ring-white/20',
      outline: 'border-2 border-gray-300 dark:border-slate-600 bg-transparent text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500/20'
    };
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
    
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={classes}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;