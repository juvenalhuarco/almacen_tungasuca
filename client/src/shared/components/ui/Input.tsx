import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightElement, className, id, required, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={cn(
            'input',
            leftIcon ? 'pl-9' : undefined,
            rightElement ? 'pr-10' : undefined,
            error ? 'input-error' : undefined,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {rightElement && (
          <span className="absolute inset-y-0 right-2 flex items-center">{rightElement}</span>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});
