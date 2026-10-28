import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: Array<{ value: string | number; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, placeholder, options, className, id, required, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        required={required}
        className={cn('input', error && 'input-error')}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});
