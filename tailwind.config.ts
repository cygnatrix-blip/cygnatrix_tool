import type { Config } from 'tailwindcss';

/**
 * Cygnatrix Tools design tokens.
 * Brand: connected to Cygnatrix (deep ink + a confident teal/cyan accent) but its own
 * lighter, utility-first identity. Restrained, high-contrast, fast.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './config/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        brand: {
          50: '#eefdfb',
          100: '#d5faf4',
          200: '#aef3ea',
          300: '#77e7db',
          400: '#3ad2c6',
          500: '#17b3a8',
          600: '#0d9089',
          700: '#0f726e',
          800: '#115b58',
          900: '#134b49',
          950: '#042d2c',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d9e2',
          300: '#aeb7c8',
          400: '#8290a8',
          500: '#63728c',
          600: '#4e5a73',
          700: '#40495d',
          800: '#373f4f',
          900: '#0f1729',
          950: '#080d1a',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,41,0.06), 0 6px 20px -4px rgba(15,23,41,0.10)',
        'card-hover': '0 2px 6px rgba(15,23,41,0.08), 0 16px 40px -8px rgba(15,23,41,0.18)',
      },
      maxWidth: {
        prose: '68ch',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
