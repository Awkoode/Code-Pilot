export function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
        <span>© {new Date().getFullYear()} CodePilot</span>
        <span className="font-mono text-xs">Análise inteligente de repositórios GitHub</span>
      </div>
    </footer>
  );
}
