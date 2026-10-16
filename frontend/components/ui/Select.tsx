import { ReactNode, SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { FieldLabel, FieldMessage, FieldSize, fieldBoxClasses } from './Input';
import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: ReactNode;
  hideLabel?: boolean;
  optional?: boolean;
  error?: string;
  helperText?: ReactNode;
  /** Options to render. You can pass <option> children instead. */
  options?: SelectOption[];
  /** A disabled first option shown while value is "". */
  placeholder?: string;
  /** Icon inside the box before the value (e.g. <ArrowUpDown />). */
  leading?: ReactNode;
  selectSize?: FieldSize;
  /** Classes for the visible box. */
  className?: string;
  /** Classes for the outer wrapper (label + box + messages). */
  containerClassName?: string;
}

const heights: Record<FieldSize, string> = {
  sm: 'h-8 text-[13px]',
  md: 'h-10 text-sm',
  lg: 'h-12 text-[15px]',
};

/** A styled native <select>: keyboard and screen-reader behaviour come for free. */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      hideLabel,
      optional,
      error,
      helperText,
      options,
      placeholder,
      leading,
      selectSize = 'md',
      id,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const selectId = id ?? `select-${autoId}`;
    const messageId = `${selectId}-message`;
    const hasMessage = Boolean(error || helperText);

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && <FieldLabel htmlFor={selectId} label={label} optional={optional} hidden={hideLabel} />}
        <div className={cn('relative flex w-full items-center', heights[selectSize], fieldBoxClasses({ error: !!error, disabled }), className)}>
          {leading && (
            <span aria-hidden="true" className="pointer-events-none absolute left-3 flex items-center text-fg-subtle [&_svg]:h-4 [&_svg]:w-4">
              {leading}
            </span>
          )}
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={hasMessage ? messageId : undefined}
            className={cn(
              'h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-control bg-transparent pr-9 font-medium text-fg focus:outline-none disabled:cursor-not-allowed',
              leading ? 'pl-9' : 'pl-3'
            )}
            {...props}
          >
            {placeholder !== undefined && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled} className="bg-surface-2 text-fg">
                {o.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 h-4 w-4 text-fg-subtle"
            strokeWidth={1.75}
          />
        </div>
        <FieldMessage id={messageId} error={error} helperText={helperText} />
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export default Select;
