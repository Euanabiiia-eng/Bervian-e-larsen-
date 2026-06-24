import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#8B6914',
        'gold-light': '#B8965A',
        'gold-pale': '#D4B87A',
        ink: '#0E0D0C',
        'ink-dim': '#2A2820',
        'ink-pale': '#6A6458',
        'white-cream': '#F7F2EA',
        card: '#EDE5D8',
        card2: '#E4DAC8',
        ok: '#3D6B4F',
        danger: '#8B2020',
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        jost: ['Jost', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}

export default config
