// cyberpunk-preset.ts
import type { Config } from 'tailwindcss';

export const cyberColors = {
  neutral: {
    950: '#0a0a0a', // Main Background
    900: '#171717', // Panels
    800: '#262626', // Borders
    700: '#404040', // Muted Text
    600: '#525252',
    500: '#737373',
    400: '#a3a3a3', // Secondary Text
    300: '#d4d4d4',
    200: '#e5e5e5', // Primary Text
    100: '#f5f5f5', // High Contrast / Buttons
    50: '#fafafa',
  },
  blue: {
    400: '#60a5fa',
    500: '#3b82f6',
    900: '#1e3a8a',
  },
  red: {
    400: '#f87171',
    900: '#7f1d1d',
  },
  emerald: {
    400: '#34d399',
    900: '#064e3b',
  },
  primary: {
    DEFAULT: '#00f0ff',
    dim: '#00a0aa',
    glow: 'rgba(0, 240, 255, 0.5)',
  },
  secondary: {
    DEFAULT: '#7000ff',
    dim: '#4a00aa',
    glow: 'rgba(112, 0, 255, 0.5)',
  },
  accent: {
    pink: '#ff0080',
  },
  success: { DEFAULT: '#00ff9f', glow: 'rgba(0, 255, 159, 0.3)' },
  danger: { DEFAULT: '#ff003c', glow: 'rgba(255, 0, 60, 0.3)' },
  warning: { DEFAULT: '#fcee0a', glow: 'rgba(252, 238, 10, 0.3)' },
} as const;

// IMPORTANT: this is a *preset*, not a full config
// Use Partial<Config> so TS doesn't require `content`
const cyberpunkPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: cyberColors,
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-primary': `0 0 5px ${cyberColors.primary.DEFAULT}, 0 0 20px ${cyberColors.primary.glow}`,
        'neon-secondary': `0 0 5px ${cyberColors.secondary.DEFAULT}, 0 0 20px ${cyberColors.secondary.glow}`,
        'neon-danger': `0 0 5px ${cyberColors.danger.DEFAULT}, 0 0 20px ${cyberColors.danger.glow}`,
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blink: 'blink 1s step-end infinite',
        scanline: 'scanline 8s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      zIndex: {
        base: '0',
        pane: '10',
        header: '20',
        modal: '50',
        popover: '60',
        toast: '70',
        max: '9999',
      },
    },
  },
  plugins: [],
};

export default cyberpunkPreset;
