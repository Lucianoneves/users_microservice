type FormFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

export function FormField({
  id,
  label,
  type = 'text',
  value,
  error,
  placeholder,
  autoComplete,
  onChange,
}: FormFieldProps) {
  const inputId = `field-${id}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
            : 'border-teal-200 focus:border-teal-500 focus:ring-teal-200'
        }`}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
