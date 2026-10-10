import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal, Tilt } from '../components/anim';

const STORAGE_KEY = 'codepilot_suporte_texto';

/**
 * Easter egg: uma página quase vazia para exibir o GIF e um texto livre.
 *
 * O texto persiste em localStorage, então sobrevive a recarregar a página.
 */
export default function Suporte() {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) setTexto(salvo);
    } catch {
      // localStorage indisponível (modo privado): a página funciona sem persistir
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, texto);
    } catch {
      // ignora falha de escrita
    }
  }, [texto]);

  return (
    <div className="mx-auto flex min-h-[78vh] max-w-2xl flex-col items-center px-4 py-16 sm:px-6">
      <Reveal from="top" duration={800}>
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-text-primary"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Voltar
        </Link>
      </Reveal>

      {/* ------------------------------- GIF ------------------------------- */}
      <Reveal from="scale" delay={120} duration={1000}>
        <Tilt intensity={7} lift={18}>
          <div className="edge-glow-subtle relative mt-8 overflow-hidden rounded-3xl border border-border bg-surface/60 p-3 backdrop-blur-md">
            <div
              className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/25 blur-[70px]"
              aria-hidden="true"
            />
            <img
              src="/suporte.gif"
              alt="GIF de suporte"
              width={440}
              height={440}
              className="relative h-auto w-full max-w-[440px] rounded-2xl"
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </Tilt>
      </Reveal>

      {/* ------------------------------ TEXTO ------------------------------ */}
      <Reveal from="bottom" delay={260} distance={40} duration={900}>
        <div className="mt-8 w-full">
          <div className="depth-card rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
            <label
              htmlFor="suporte-texto"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500"
            >
              PROJETO CRIADO POR ARTHUR WOLF KOLOGESKI, VULGO ARKOL, ABRAÇO!!
            </label> 
          </div>
        </div>
      </Reveal>
    </div>
  );
}