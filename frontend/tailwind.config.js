/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', '"Space Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        night: {
          50: '#f0f0f5',
          100: '#d1d1e0',
          200: '#a3a3c2',
          300: '#7575a3',
          400: '#4d4d85',
          500: '#2e2e6b',
          600: '#1e1e52',
          700: '#13133a',
          800: '#0c0c26',
          900: '#060614',
          950: '#02020a',
        },
        acid: {
          DEFAULT: '#c8ff00',
          dark: '#9bc400',
          light: '#d9ff4d',
        },
        plasma: {
          DEFAULT: '#ff3cac',
          dark: '#cc1f85',
          light: '#ff70c4',
        },
        cyber: {
          DEFAULT: '#00f5ff',
          dark: '#00b8bf',
          light: '#66f9ff',
        },
      },
      backgroundImage: {
        'grid-night': `
          linear-gradient(rgba(200,255,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,255,0,0.03) 1px, transparent 1px)
        `,
        'glow-acid': 'radial-gradient(circle at 50% 50%, rgba(200,255,0,0.15), transparent 70%)',
        'glow-plasma': 'radial-gradient(circle at 50% 50%, rgba(255,60,172,0.15), transparent 70%)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(200,255,0,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(200,255,0,0.6), 0 0 80px rgba(200,255,0,0.2)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
