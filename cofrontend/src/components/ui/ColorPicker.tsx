import { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const presetColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-all hover:border-primary/50"
        aria-label="Selecionar cor"
      >
        <div className="h-5 w-5 rounded" style={{ backgroundColor: value }} />
        <span className="font-mono text-sm text-slate-300">{value}</span>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 rounded-lg border border-border bg-surface p-3 shadow-xl animate-scale-in">
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className={`h-8 w-8 rounded-lg transition-transform hover:scale-110 ${
                  value === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Cor ${color}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 rounded border border-border bg-background px-2 py-1 font-mono text-sm text-slate-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}
