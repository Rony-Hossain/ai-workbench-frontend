const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Explicitly define the content paths (No Nx Utilities)
  content: [
    join(__dirname, 'src/**/*.{ts,tsx,html}'),
    join(__dirname, '../../libs/**/*.{ts,tsx,html}'), // Scan all libs
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          950: '#0a0a0a', 900: '#171717', 800: '#262626',
          700: '#404040', 600: '#525252', 500: '#737373',
          400: '#a3a3a3', 300: '#d4d4d4', 200: '#e5e5e5',
          100: '#f5f5f5', 50: '#fafafa',
        },
        primary: { DEFAULT: '#00f0ff', dim: '#00a0aa', glow: 'rgba(0, 240, 255, 0.5)' },
        secondary: { DEFAULT: '#7000ff', dim: '#4a00aa', glow: 'rgba(112, 0, 255, 0.5)' },
        accent: { pink: '#ff0080' },
        success: { DEFAULT: '#00ff9f', glow: 'rgba(0, 255, 159, 0.3)' },
        danger: { DEFAULT: '#ff003c', glow: 'rgba(255, 0, 60, 0.3)' },
        warning: { DEFAULT: '#fcee0a', glow: 'rgba(252, 238, 10, 0.3)' },
        blue: { 400: '#60a5fa', 500: '#3b82f6', 900: '#1e3a8a' },
        red: { 400: '#f87171', 900: '#7f1d1d' },
        emerald: { 400: '#34d399', 900: '#064e3b' },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-primary': '0 0 5px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-secondary': '0 0 5px #7000ff, 0 0 20px rgba(112, 0, 255, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      zIndex: {
        base: '0', pane: '10', header: '20', modal: '50', popover: '60', toast: '70', max: '9999',
      },
    },
  },
  plugins: [],
};