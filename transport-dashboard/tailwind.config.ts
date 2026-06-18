import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2F3E1F',
          primaryDark: '#243217',
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
      },
    },
  },
}

export default config
