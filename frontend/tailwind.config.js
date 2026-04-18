/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        neon: {
          DEFAULT: '#00ff88',
          blue: '#00d4ff',
          purple: '#bf5af2',
          gold: '#ffd60a',
          orange: '#ff6b35',
        },
        dark: {
          bg: '#050508',
          surface: '#0d0d14',
          card: '#111118',
          border: 'rgba(255,255,255,0.08)',
        },
        // Keep backward compat
        night: {
          950: '#050508',
          900: '#0d0d14',
          800: '#111118',
        },
        acid: { DEFAULT: '#00ff88', light: '#7fffbe', dark: '#00b85e' },
        plasma: { DEFAULT: '#ff6b35', light: '#ffaa85', dark: '#c44a18' },
        cyber: { DEFAULT: '#00d4ff', light: '#7aeaff', dark: '#0092b8' },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'orbit': 'orbit-spin 10s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'orbit-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      backgroundImage: {
        'grid-neon': `
          linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
        `,
      },
    },
  },
  plugins: [],
}
