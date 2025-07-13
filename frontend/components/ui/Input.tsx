import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#182435] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border-2 border-[#cbd5e1] bg-white text-[#182435] rounded-lg transition-all duration-200 focus:outline-none focus:border-[#6fbcf0] focus:ring-2 focus:ring-[#6fbcf0] focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#9ca3af] ${
            error ? 'border-[#ff794b] focus:border-[#ff794b] focus:ring-[#ff794b]' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-[#ff794b]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[#636871]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;