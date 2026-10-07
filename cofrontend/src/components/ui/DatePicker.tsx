interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
}

export function DatePicker({ value, onChange, label, placeholder = 'Selecionar data' }: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onChange(date);
  };

  return (
    <div className="relative">
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <input
          type="date"
          value={value ? value.toISOString().split('T')[0] : ''}
          onChange={handleChange}
          className="
            w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-slate-100
            transition-all duration-300 ease-out
            focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40
          "
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
