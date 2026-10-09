/** @type {import('tailwindcss').Config} */

// Consome os canais RGB definidos no index.css, para que as utilities
// acompanhem a troca de tema e os modificadores de opacidade continuem
// funcionando (ex: bg-primary/10, border-primary/60).
const channel = (name) => `rgb(var(--ch-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: channel('bg'),
        surface: channel('surface'),
        tertiary: channel('tertiary'),
        elevated: channel('elevated'),
        border: channel('border'),
        text: {
          DEFAULT: channel('text'),
          primary: channel('text'),
          secondary: '#475569',
        },
        primary: {
          DEFAULT: channel('primary'),
          hover: channel('primary-hover'),
        },
        accent: channel('accent'),
        success: channel('success'),
        warning: channel('warning'),
        error: channel('error'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
