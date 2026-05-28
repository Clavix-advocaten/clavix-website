/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-tinted': 'var(--color-bg-tinted)',
        'bg-inverse': 'var(--color-bg-inverse)',

        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          accent: 'var(--color-text-accent)',
          inverse: 'var(--color-text-inverse)',
        },

        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
          accent: 'var(--color-border-accent)',
          subtle: 'var(--color-border-subtle)',
        },

        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
        },

        action: {
          DEFAULT: 'var(--color-action)',
          hover: 'var(--color-action-hover)',
          active: 'var(--color-action-active)',
          fg: 'var(--color-action-fg)',
        },
        'action-secondary': {
          DEFAULT: 'var(--color-action-secondary)',
          hover: 'var(--color-action-secondary-hover)',
          fg: 'var(--color-action-secondary-fg)',
        },

        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        critical: 'var(--color-critical)',

        royal: {
          50: '#F5F5F9', 100: '#E6E7F0', 200: '#C0C2D9', 300: '#9295BA', 400: '#5E60A0',
          500: '#3F4287', 600: '#2A2C70', 700: '#21235B', 800: '#181A45', 900: '#0E0F2A', 950: '#07081A',
        },
        sand: {
          50: '#FBF8F1', 100: '#F5EFE3', 200: '#EDE3CD', 300: '#E3D5B9', 400: '#D4C29B',
          500: '#C2A87C', 600: '#A98A5A', 700: '#8B6F46', 800: '#6E5638', 900: '#4D3C27',
        },
      },

      fontFamily: {
        display: ['Montserrat Variable', 'system-ui', 'sans-serif'],
        body: ['Montserrat Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },

      fontSize: {
        // KLEINER display font cap zodat hero-titel niet over 5 regels breekt
        display: ['clamp(2rem, 3.5vw + 0.5rem, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h1: ['clamp(1.75rem, 2.5vw + 0.75rem, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.5rem, 1.5vw + 0.75rem, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        h3: ['clamp(1.2rem, 0.75vw + 0.85rem, 1.4rem)', { lineHeight: '1.3' }],
        h4: ['1.0625rem', { lineHeight: '1.3' }],
        lead: ['clamp(1.0625rem, 0.4vw + 0.95rem, 1.2rem)', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.65' }],
        small: ['0.9375rem', { lineHeight: '1.5' }],
        tiny: ['0.8125rem', { lineHeight: '1.5' }],
      },

      maxWidth: {
        readable: '65ch',
        content: '720px',
        container: '1200px',
        wide: '1440px',
      },
    },
  },
  plugins: [],
}
