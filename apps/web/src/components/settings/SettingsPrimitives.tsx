import type { ReactNode } from 'react';
import { useState } from 'react';

type SettingsCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SettingsCard({
  title,
  description,
  children,
  actions,
  className = '',
}: SettingsCardProps): JSX.Element {
  return (
    <div className={`glass-card rounded-2xl p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

type FieldRowProps = {
  label: string;
  description?: string;
  children: ReactNode;
  htmlFor?: string;
};

export function FieldRow({
  label,
  description,
  children,
  htmlFor,
}: FieldRowProps): JSX.Element {
  return (
    <div className="grid sm:grid-cols-[1fr_minmax(0,1.4fr)] gap-3 sm:gap-6 items-start">
      <div>
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-foreground block"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const inputClass =
  'w-full h-9 px-3 rounded-lg glass-card text-sm text-foreground placeholder:text-muted-foreground ' +
  'focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors';

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
  type = 'text',
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  id?: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
}): JSX.Element {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
  id?: string;
}): JSX.Element {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass + ' appearance-none pr-8 bg-[length:16px_16px] bg-no-repeat bg-[position:right_0.5rem_center]'}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/></svg>\")",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: ToggleProps): JSX.Element {
  return (
    <label
      className={[
        'inline-flex items-start gap-3 cursor-pointer min-h-[24px]',
        disabled && 'opacity-50 cursor-not-allowed',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative inline-block flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={[
            'block w-11 h-6 rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-white/[0.10] ring-1 ring-white/[0.06]',
          ].join(' ')}
        />
        <span
          aria-hidden
          className={[
            'absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-foreground shadow-lg shadow-black/40 transition-transform',
            checked && 'translate-x-5',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col min-w-0">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
