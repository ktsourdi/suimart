import { ReactNode, TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { FieldLabel, FieldMessage, fieldBoxClasses } from './Input';
import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hideLabel?: boolean;
  optional?: boolean;
  error?: string;
  helperText?: ReactNode;
  /** With maxLength, shows a "120 / 500" counter under the field. */
  showCount?: boolean;
  /** Classes for the <textarea> itself. */
  className?: string;
  /** Classes for the outer wrapper (label + field + messages). */
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, containerClassName, label, hideLabel, optional, error, helperText, showCount, id, disabled, maxLength, value, ...props },
    ref
  ) => {
    const autoId = useId();
    const fieldId = id ?? `textarea-${autoId}`;
    const messageId = `${fieldId}-message`;
    const hasMessage = Boolean(error || helperText);
    const length = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && <FieldLabel htmlFor={fieldId} label={label} optional={optional} hidden={hideLabel} />}
        <textarea
          ref={ref}
          id={fieldId}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            'block min-h-[128px] w-full resize-y px-3 py-2.5 text-sm leading-6 placeholder:text-fg-subtle focus:outline-none',
            fieldBoxClasses({ error: !!error, disabled }),
            className
          )}
          {...props}
        />
        <FieldMessage
          id={messageId}
          error={error}
          helperText={helperText}
          extra={
            showCount && maxLength ? (
              <span className="ml-auto shrink-0 tabular-nums text-fg-subtle">
                {length} / {maxLength}
              </span>
            ) : undefined
          }
        />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
