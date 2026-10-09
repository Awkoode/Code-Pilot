import { Link } from 'react-router-dom';
import { CountUp, Reveal } from '../components/anim';

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />

      <div className="relative">
        <Reveal from="blur" duration={1000}>
          <p className="text-animated-gradient font-mono text-8xl font-bold tabular-nums">
            404
          </p>
        </Reveal>

        <Reveal from="bottom" delay={200} distance={30} duration={800}>
          <h1 className="mt-5 text-2xl font-bold text-text-primary">Página não encontrada</h1>
          <p className="mt-3 text-slate-400">
            O endereço que você acessou não existe ou foi movido.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="hover-sheen rounded-lg bg-gradient-to-r from-primary to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
            >
              Voltar ao início
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:text-text-primary"
            >
              Ir para o dashboard
            </Link>
          </div>

          <p className="mt-12 font-mono text-xs uppercase tracking-[0.24em] text-slate-600">
            erro <CountUp value={404} startOnView={false} /> · rota inexistente
          </p>
        </Reveal>
      </div>
    </div>
  );
}
