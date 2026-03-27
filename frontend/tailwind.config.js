/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#d8e0ff',
          200: '#b3c2ff',
          300: '#7a94ff',
          400: '#4a6cf7',
          500: '#1a3a8f',
          600: '#0f2b6e',
          700: '#0b2058',
          800: '#081842',
          900: '#050f2e',
          950: '#020818',
        },
        gold: {
          50: '#fffdf0',
          100: '#fff8d6',
          200: '#fff0a8',
          300: '#ffe566',
          400: '#ffd83d',
          500: '#f5c518',
          600: '#d4a10e',
          700: '#a87a0a',
          800: '#7a5908',
          900: '#5c4306',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.06)',
        'glow-gold': '0 0 20px rgba(245, 197, 24, 0.15)',
        'glow-blue': '0 0 20px rgba(26, 58, 143, 0.15)',
      },
    },
  },
  plugins: [],
}
