import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from './cn';

export type FieldSize = 'sm' | 'md' | 'lg';

/** Shared look of every text control (Input box, Textarea, Select). */
export const fieldBoxClasses = (opts: { error?: boolean; disabled?: boolean } = {}) =>
  cn(
    'rounded-control border bg-surface-2 text-fg transition-[border-color,box-shadow,background-color] duration-150',
    opts.error
      ? 'border-danger/60 focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/25'
      : 'border-line-strong hover:border-fg-subtle/30 focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20',
    opts.disabled && 'cursor-not-allowed opacity-50'
  );

const heights: Record<FieldSize, string> = {
  sm: 'h-8 px-2.5 text-[13px] gap-2',
  md: 'h-10 px-3 text-sm gap-2.5',
  lg: 'h-12 px-3.5 text-[15px] gap-2.5',
};

export interface FieldLabelProps {
  htmlFor: string;
  label: ReactNode;
  optional?: boolean;
  hidden?: boolean;
}

export function FieldLabel({ htmlFor, label, optional, hidden }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(hidden ? 'sr-only' : 'mb-2 flex items-baseline justify-between gap-2 text-[13px] font-medium text-fg')}
    >
      <span>{label}</span>
      {optional && !hidden && <span className="text-xs font-normal text-fg-subtle">Optional</span>}
    </label>
  );
}

export function FieldMessage({ id, error, helperText, extra }: { id: string; error?: string; helperText?: ReactNode; extra?: ReactNode }) {
  if (!error && !helperText && !extra) return null;
  return (
    <div className="mt-2 flex items-start justify-between gap-3 text-[13px] leading-5">
      {error ? (
        <p id={id} className="flex items-start gap-1.5 text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={id} className="text-fg-subtle">
          {helperText}
        </p>
      ) : (
        <span />
      )}
      {extra}
    </div>
  );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  /** Keep the label for screen readers but hide it visually (e.g. a search box). */
  hideLabel?: boolean;
  optional?: boolean;
  error?: string;
  helperText?: ReactNode;
  /** Icon or node inside the box, before the text (e.g. <Search className="h-4 w-4" />). */
  leading?: ReactNode;
  /** Node inside the box, after the text (e.g. a "SUI" suffix or a button). */
  trailing?: ReactNode;
  inputSize?: FieldSize;
  /** Classes for the visible box. */
  className?: string;
  /** Classes for the outer wrapper (label + box + messages). */
  containerClassName?: string;
  /** Classes for the raw <input>, e.g. "text-right font-mono". */
  inputClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      inputClassName,
      label,
      hideLabel,
      optional,
      error,
      helperText,
      leading,
      trailing,
      inputSize = 'md',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? `input-${autoId}`;
    const messageId = `${inputId}-message`;
    const hasMessage = Boolean(error || helperText);

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && <FieldLabel htmlFor={inputId} label={label} optional={optional} hidden={hideLabel} />}
        <div className={cn('flex w-full items-center', heights[inputSize], fieldBoxClasses({ error: !!error, disabled }), className)}>
          {leading && (
            <span aria-hidden="true" className="flex shrink-0 items-center text-fg-subtle [&_svg]:h-4 [&_svg]:w-4">
              {leading}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={hasMessage ? messageId : undefined}
            className={cn(
              'h-full w-full min-w-0 flex-1 bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none disabled:cursor-not-allowed',
              inputClassName
            )}
            {...props}
          />
          {trailing && <span className="flex shrink-0 items-center text-[13px] font-medium text-fg-subtle">{trailing}</span>}
        </div>
        <FieldMessage id={messageId} error={error} helperText={helperText} />
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
