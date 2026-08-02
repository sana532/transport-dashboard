import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'IBM Plex Sans Arabic',
          'system-ui',
          'Segoe UI',
          'sans-serif',
        ],
        heading: [
          'Plus Jakarta Sans',
          'IBM Plex Sans Arabic',
          'system-ui',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          primary: '#2F3E1F',
          primaryDark: '#243217',
          accent: '#4A6741',
        },
        background: 'var(--app-bg)',
        surface: {
          DEFAULT: 'var(--app-surface)',
          muted: 'var(--app-surface-muted)',
        },
        text: {
          primary: 'var(--app-text-primary)',
          secondary: 'var(--app-text-secondary)',
          muted: 'var(--app-text-muted)',
        },
        border: 'var(--app-border)',
        ring: '#2F3E1F',
        table: {
          DEFAULT: 'var(--table-bg)',
          head: 'var(--table-head)',
          headFg: 'var(--table-head-fg)',
          rowAlt: 'var(--table-row-alt)',
          rowHover: 'var(--table-row-hover)',
          border: 'var(--table-border)',
        },
      },
    },
  },
}

export default config
