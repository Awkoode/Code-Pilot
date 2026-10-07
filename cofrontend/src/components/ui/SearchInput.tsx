import { useState, type InputHTMLAttributes } from 'react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({ onSearch, debounceMs = 300, className = '', ...rest }: SearchInputProps) {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onSearch) {
      setTimeout(() => onSearch(newValue), debounceMs);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        className="
          w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-slate-100
          placeholder:text-slate-500
          transition-all duration-300 ease-out
          focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40
        "
        {...rest}
      />
      {value && (
        <button
          onClick={() => {
            setValue('');
            onSearch?.('');
          }}
          aria-label="Limpar busca"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 transition-colors hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
