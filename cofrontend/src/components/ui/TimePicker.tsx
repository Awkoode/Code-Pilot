import { useState } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const [hour, minute] = value.split(':');

  return (
    <div className="relative">
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-slate-100
          transition-all duration-300 ease-out
          focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40
        "
      >
        {value || 'Selecionar hora'}
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 rounded-lg border border-border bg-surface p-3 shadow-xl animate-scale-in">
          <div className="flex gap-2">
            <div>
              <p className="mb-1 text-xs text-slate-500">Hora</p>
              <select
                value={hour}
                onChange={(e) => onChange(`${e.target.value}:${minute}`)}
                className="rounded border border-border bg-background px-2 py-1 text-sm text-slate-300"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">Minuto</p>
              <select
                value={minute}
                onChange={(e) => onChange(`${hour}:${e.target.value}`)}
                className="rounded border border-border bg-background px-2 py-1 text-sm text-slate-300"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
