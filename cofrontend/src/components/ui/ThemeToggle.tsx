import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="relative flex h-8 w-14 items-center rounded-full border border-border bg-surface p-1 transition-all duration-300 ease-out hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <span
        className={`
          flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md
          transition-all duration-300 ease-out
          ${isDark ? 'translate-x-0' : 'translate-x-6'}
        `}
      >
        {isDark ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </span>
    </button>
  );
}
