import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * BotÃ£o de verificaÃ§Ã£o de serviÃ§o.
 *
 * A animaÃ§Ã£o Ã© toda concentrada no prÃ³prio botÃ£o, como pedido:
 *
 *   idle      -> base com brilho lento
 *   loading   -> anel que gira + varredura de gradiente + pulsos internos
 *   ok        -> varredura verde que cruza o botÃ£o, check e halo pulsante
 *   error     -> tremor vermelho + halo que some
 *
 * O "ok" Ã© temporÃ¡rio e volta para o estado inicial sozinho, para o botÃ£o
 * nÃ£o ficar marcado para sempre.
 */

export type ServiceState = 'idle' | 'loading' | 'ok' | 'error';

interface ServiceButtonProps {
  label: string;
  /** Texto enquanto verifica. */
  loadingLabel?: string;
  /** Executa a checagem. Deve rejeitar em falha. */
  onCheck: () => Promise<string>;
  tone?: 'primary' | 'neutral';
  disabled?: boolean;
  className?: string;
}

const OK_HOLD_MS = 2600;
const ERROR_HOLD_MS = 3600;

export function ServiceButton({
  label,
  loadingLabel = 'Verificando...',
  onCheck,
  tone = 'primary',
  disabled = false,
  className = '',
}: ServiceButtonProps) {
  const [state, setState] = useState<ServiceState>('idle');
  const [detail, setDetail] = useState('');
  const timer = useRef<number | null>(null);
  const running = useRef(false);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const hold = useCallback((ms: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setState('idle');
      setDetail('');
    }, ms);
  }, []);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setState('loading');
    setDetail('');

    try {
      const info = await onCheck();
      setState('ok');
      setDetail(info);
      hold(OK_HOLD_MS);
    } catch (err) {
      setState('error');
      setDetail(err instanceof Error ? err.message : 'Falhou');
      hold(ERROR_HOLD_MS);
    } finally {
      running.current = false;
    }
  }, [onCheck, hold]);

  const isPrimary = tone === 'primary';

  // Camadas visuais por estado.
  const ringColor =
    state === 'ok' ? 'rgba(34,197,94,0.9)' : state === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(99,102,241,0.9)';

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={run}
        disabled={disabled || state === 'loading'}
        aria-busy={state === 'loading'}
        className={`
          group relative isolate flex w-full items-center justify-center gap-2.5 overflow-hidden
          rounded-xl border px-5 py-3 text-sm font-semibold
          transition-[transform,box-shadow,border-color] duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
          disabled:cursor-not-allowed
          ${state === 'loading' ? 'cursor-progress' : ''}
          ${isPrimary
            ? 'border-primary/40 bg-primary/10 text-white hover:border-primary/70'
            : 'border-border bg-surface/70 text-slate-200 hover:border-primary/50'}
        `}
        style={
          state === 'error'
            ? { animation: 'shake 0.45s var(--ease-in-out)' }
            : state === 'ok'
              ? { animation: 'okPop 0.5s var(--ease-bounce)' }
              : undefined
        }
      >
        {/* halo pulsante atrÃ¡s */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl transition-opacity duration-500"
          style={{
            opacity: state === 'loading' ? 1 : state === 'ok' ? 0.55 : 0.18,
            background: `radial-gradient(120% 140% at 50% 120%, ${ringColor}, transparent 70%)`,
            filter: 'blur(14px)',
            animation:
              state === 'loading'
                ? 'pulseGlow 1.4s ease-in-out infinite'
                : state === 'ok'
                  ? 'okHalo 2s ease-in-out 1'
                  : undefined,
          }}
        />

        {/* varredura de gradiente enquanto carrega */}
        {state === 'loading' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-xl"
          >
            <span
              className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent"
              style={{ animation: 'shimmerSweep 1.1s linear infinite' }}
            />
          </span>
        )}

        {/* varredura de confirmaÃ§Ã£o */}
        {state === 'ok' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-xl"
          >
            <span
              className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-green-400/45 to-transparent"
              style={{ animation: 'confirmSweep 0.75s var(--ease-out) forwards' }}
            />
          </span>
        )}

        {/* borda que acende conforme o estado */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl transition-all duration-500"
          style={{
            boxShadow:
              state === 'loading'
                ? `0 0 0 1px ${ringColor}, 0 0 22px ${ringColor}`
                : state === 'ok'
                  ? '0 0 0 1px rgba(34,197,94,0.7), 0 0 26px rgba(34,197,94,0.45)'
                  : state === 'error'
                    ? '0 0 0 1px rgba(239,68,68,0.7), 0 0 22px rgba(239,68,68,0.4)'
                    : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        />

        {/* Ã­cone */}
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          {state === 'loading' && (
            <>
              <span
                className="absolute inset-0 rounded-full border-2 border-primary/25"
                aria-hidden="true"
              />
              <span
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
                style={{ animation: 'spin 0.7s linear infinite' }}
                aria-hidden="true"
              />
              <span
                className="absolute inset-0 rounded-full bg-primary/30"
                style={{ animation: 'pingSlow 1.2s var(--ease-out) infinite' }}
                aria-hidden="true"
              />
            </>
          )}

          {state === 'ok' && (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-400" style={{ animation: 'drawCheck 0.45s var(--ease-out)' }}>
              <path
                d="M20 6 9 17l-5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {state === 'error' && (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-400">
              <path
                d="M18 6 6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          )}

          {state === 'idle' && <SlotIcon />}
        </span>

        {/* rÃ³tulo */}
        <span className="relative text-left">
          <span className="block">
            {state === 'loading' ? loadingLabel : state === 'ok' ? 'Funcionando' : state === 'error' ? 'IndisponÃ­vel' : label}
          </span>
          {detail && state !== 'loading' && (
            <span
              className={`mt-0.5 block font-mono text-[10px] font-normal ${
                state === 'ok' ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {detail}
            </span>
          )}
        </span>
      </button>

      {/* anel externo que se expande ao confirmar */}
      {state === 'ok' && (
        <span
          key={detail + state}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl border border-green-400/60"
          style={{ animation: 'ringExpand 0.9s var(--ease-out) forwards' }}
        />
      )}
    </div>
  );
}

function SlotIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 transition-colors duration-300 group-hover:text-primary">
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
    </svg>
  );
}