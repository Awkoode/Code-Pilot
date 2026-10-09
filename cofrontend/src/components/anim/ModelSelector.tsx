import { useEffect, useRef, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { api, toApiError } from '../../services/api';
import type { ModelSpec } from '../../types';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

const BADGE_TONE = {
  recomendado: 'green',
  rapido: 'primary',
  alternativa: 'purple',
} as const;

const formatCtx = (n: number) =>
  n >= 1000 ? `${Math.round(n / 1024)}k` : String(n);

export function ModelSelector({ value, onChange, disabled = false }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelSpec[]>([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .models()
      .then((r) => {
        if (cancelled) return;
        setModels(r.models);
        setDefaultModel(r.defaultModel);
        // Se nada foi escolhido ainda, adota o padrão do backend.
        if (!value && r.defaultModel) onChange(r.defaultModel);
      })
      .catch((e) => !cancelled && setError(toApiError(e).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fecha ao clicar fora / pressionar Esc
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Spinner text="Carregando modelos..." />
      </div>
    );
  }

  if (error || models.length === 0) {
    return (
      <p className="text-xs text-red-400">
        {error ?? 'Nenhum modelo disponível.'}
      </p>
    );
  }

  const selected = models.find((m) => m.id === value) ?? models[0];

  return (
    <div ref={rootRef} className="relative w-full">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Modelo de IA
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface/70 px-4 py-2.5 text-left transition-all duration-300 hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-white">{selected.label}</span>
          <span className="block truncate font-mono text-[11px] text-slate-500">
            {selected.provider} · {formatCtx(selected.contextLength)} ctx
          </span>
        </span>

        <span
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="depth-card absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-elevated/95 p-1.5 backdrop-blur-xl"
          style={{ animation: 'blurIn 200ms var(--ease-out)' }}
        >
          {models.map((m) => {
            const active = m.id === selected.id;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                    active ? 'bg-primary/15' : 'hover:bg-surface'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          active ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {m.label}
                      </span>
                      <Badge tone={BADGE_TONE[m.badge]}>{m.badge}</Badge>
                      {m.id === defaultModel && (
                        <span className="font-mono text-[10px] text-slate-500">padrão</span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                      {m.description}
                    </span>
                  </span>

                  {active && (
                    <span className="shrink-0 text-sm text-accent" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
