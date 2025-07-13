import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#182435] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 border-2 border-[#cbd5e1] bg-white text-[#182435] rounded-lg transition-all duration-200 focus:outline-none focus:border-[#6fbcf0] focus:ring-2 focus:ring-[#6fbcf0] focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#9ca3af] resize-vertical min-h-[100px] ${
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

Textarea.displayName = 'Textarea';

export default Textarea;