/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import * as path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// 1. DEFINE CONFIG IN-MEMORY (No file reading required)
const tailwindConfig = {
  content: [
    path.join(__dirname, 'src/**/*.{ts,tsx,html}'),
    path.join(__dirname, '../../libs/**/*.{ts,tsx,html}'),
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

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/workbench-desktop',

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [react(), nxViteTsPaths()],

  // 2. PASS THE OBJECT DIRECTLY
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: tailwindConfig }),
        autoprefixer(),
      ],
    },
  },

  resolve: {
    alias: {
      '@ai-workbench/shared/ui': path.resolve(__dirname, '../../libs/shared/ui/src/index.ts'),
      '@ai-workbench/shared/layout': path.resolve(__dirname, '../../libs/shared/layout/src/index.ts'),
      '@ai-workbench/shared/icons': path.resolve(__dirname, '../../libs/shared/icons/src/index.ts'),
      '@ai-workbench/shared/electron-bridge': path.resolve(__dirname, '../../libs/shared/electron-bridge/src/index.ts'),
      '@ai-workbench/shared/state': path.resolve(__dirname, '../../libs/shared/state/src/index.ts'),
      '@ai-workbench/shared/utils': path.resolve(__dirname, '../../libs/shared/utils/src/index.ts'),
      '@ai-workbench/shared/db': path.resolve(__dirname, '../../libs/shared/db/src/index.ts'),
      '@ai-workbench/state-workbench': path.resolve(__dirname, '../../libs/state-workbench/src/index.ts'),
      '@ai-workbench/bounded-contexts': path.resolve(__dirname, '../../libs/bounded-contexts/src/index.ts'),
      '@ai-workbench/feature-cockpit': path.resolve(__dirname, '../../libs/feature-cockpit/src/index.ts'),
      '@ai-workbench/feature-agents': path.resolve(__dirname, '../../libs/feature-agents/src/index.ts'),
      '@ai-workbench/feature-chat': path.resolve(__dirname, '../../libs/feature-chat/src/index.ts'),
      '@ai-workbench/feature-files': path.resolve(__dirname, '../../libs/feature-files/src/index.ts'),
      '@ai-workbench/feature-editor': path.resolve(__dirname, '../../libs/feature-editor/src/index.ts'),
      '@ai-workbench/feature-terminal': path.resolve(__dirname, '../../libs/feature-terminal/src/index.ts'),
      '@ai-workbench/feature-permissions': path.resolve(__dirname, '../../libs/feature-permissions/src/index.ts'),
      '@ai-workbench/feature-workspace': path.resolve(__dirname, '../../libs/feature-workspace/src/index.ts'),
      '@ai-workbench/feature-auth': path.resolve(__dirname, '../../libs/feature-auth/src/index.ts'),
      '@ai-workbench/feature-lobby': path.resolve(__dirname, '../../libs/feature-lobby/src/index.ts'),
      '@ai-workbench/feature-settings': path.resolve(__dirname, '../../libs/feature-settings/src/index.ts'),
      '@ai-workbench/shared/llm-provider': path.resolve(__dirname, '../../libs/shared/llm-provider/src/index.ts'),
    },
  },

  build: {
    outDir: '../../dist/apps/workbench-desktop',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});