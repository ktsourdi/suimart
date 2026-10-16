const defaultTheme = require('tailwindcss/defaultTheme');

// Design tokens live in styles/globals.css as RGB channels ("77 162 255"), so every
// colour below supports Tailwind opacity modifiers (bg-accent/10, border-warning/30).
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

// Hairlines are white at a fixed alpha. They are written out here (not as a var)
// so Tailwind can still parse them and apply an opacity modifier if one is given.
const LINE = 'rgb(255 255 255 / 0.07)';
const LINE_STRONG = 'rgb(255 255 255 / 0.12)';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: {
          DEFAULT: token('surface'),
          2: token('surface-2'),
          3: token('surface-3'),
        },
        line: {
          DEFAULT: LINE,
          strong: LINE_STRONG,
        },
        fg: {
          DEFAULT: token('fg'),
          muted: token('fg-muted'),
          subtle: token('fg-subtle'),
        },
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          fg: token('accent-fg'),
          // shadcn-style alias kept for older markup (text-accent-foreground)
          foreground: token('accent-fg'),
        },
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),

        // Legacy shadcn names, mapped onto the new palette so older markup still
        // renders on-brand while pages are migrated. Prefer the names above.
        border: LINE,
        input: LINE_STRONG,
        ring: token('accent'),
        background: token('bg'),
        foreground: token('fg'),
        primary: { DEFAULT: token('accent'), foreground: token('accent-fg') },
        secondary: { DEFAULT: token('surface-2'), foreground: token('fg') },
        destructive: { DEFAULT: token('danger'), foreground: token('accent-fg') },
        muted: { DEFAULT: token('surface-2'), foreground: token('fg-muted') },
        popover: { DEFAULT: token('surface'), foreground: token('fg') },
        card: { DEFAULT: token('surface'), foreground: token('fg') },
      },
      borderColor: {
        DEFAULT: LINE,
      },
      ringColor: {
        DEFAULT: token('accent'),
      },
      ringOffsetColor: {
        DEFAULT: token('bg'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', 'var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        // Type scale from the brief. Pair headings with font-display.
        display: ['clamp(2.5rem, 1.6rem + 3.2vw, 4.25rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        h1: ['2.25rem', { lineHeight: '2.625rem', letterSpacing: '-0.025em' }],
        h2: ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.02em' }],
        h3: ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.011em' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        small: ['0.8125rem', { lineHeight: '1.25rem' }],
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        control: '10px',
      },
      boxShadow: {
        'card-hover': '0 24px 48px -24px rgb(0 0 0 / 0.6)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.18), 0 18px 48px -18px rgb(var(--accent) / 0.45)',
        popover: '0 0 0 1px rgb(255 255 255 / 0.04), 0 20px 48px -12px rgb(0 0 0 / 0.75)',
        button: 'inset 0 1px 0 0 rgb(255 255 255 / 0.22), 0 1px 2px 0 rgb(0 0 0 / 0.35)',
        'inset-line': 'inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'sheet-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '150% 0' },
          to: { backgroundPosition: '-50% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        'slide-up': 'slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in': 'toast-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in': 'pop-in 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'sheet-in': 'sheet-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
