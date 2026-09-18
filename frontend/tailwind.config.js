/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FDFBF7',
          100: '#FAF5EA',
          200: '#F4E7CB',
          300: '#ECD5A3',
          400: '#DFC076',
          500: '#D4AF37',
          600: '#BA9627',
          700: '#94751C',
          800: '#755B19',
          900: '#5A4617',
        },
        champagne: {
          light: '#FBF5EB',
          DEFAULT: '#F7E7CE',
          dark: '#E7D0AE',
        },
        blush: {
          50: '#FDF8F8',
          100: '#FAF0F1',
          200: '#F3DEE1',
          300: '#E8C5C8',
          400: '#D5A4A8',
          500: '#B87D82',
        },
        ivory: '#FAF8F5',
        alabaster: '#F4EFEA',
        dark: {
          950: '#0C0A09',
          900: '#141210',
          850: '#1B1816',
          800: '#231F1C',
          700: '#342F2B',
          600: '#4D4640',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
        'gold-glow-lg': '0 0 45px rgba(212, 175, 55, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
