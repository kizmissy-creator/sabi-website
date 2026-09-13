import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213D',
        teal: {
          50: '#F3FAF9',
          100: '#E5F3F2',
          200: '#CBE7E5',
          500: '#3D8583',
          600: '#156D6B',
          700: '#0D5B5A',
          800: '#084B50',
          900: '#063D45',
        },
        gold: {
          100: '#FDF4D0',
          400: '#F2C94C',
          500: '#E8B928',
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Manrope', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 45px -25px rgba(6, 61, 69, 0.28)',
        card: '0 12px 28px -22px rgba(6, 61, 69, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config
