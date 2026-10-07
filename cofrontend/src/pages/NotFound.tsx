import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center animate-fade-in-up">
      <p className="font-mono text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Página não encontrada</h1>
      <p className="mt-2 text-slate-400">O endereço que você acessou não existe ou foi movido.</p>
      <Link to="/" className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-primary-hover">
        Voltar ao início
      </Link>
    </div>
  );
}
