import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// tokens.parity.test.ts compares Mycelium token constants against ui/src/theme.
// The ui theme modules are resolved exactly as the web app sees them (web
// platform splits + APP_ID=web); aliases mirror packages/tailwind/vitest.config.ts
// (the Tamagui↔Tailwind parity harness), reduced to what the theme token
// modules pull in.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    env: {
      // The root barrel reaches @universe/environment, whose platform split
      // reads getConfig().appId at import time (packages/tailwind precedent).
      APP_ID: 'web',
    },
  },
  resolve: {
    // Prefer .web platform splits so tests exercise the web implementations.
    // Extends (rather than replaces) Vite's default extension list so
    // extensionless .mjs/.mts imports keep resolving.
    extensions: ['.web.ts', '.web.tsx', '.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      'ui/src': path.resolve(__dirname, '../ui/src'),
      'utilities/src': path.resolve(__dirname, '../utilities/src'),
      '@tamagui/core': path.resolve(__dirname, '../../node_modules/@tamagui/core/dist/cjs/index.cjs'),
      '@tamagui/web': path.resolve(__dirname, '../../node_modules/@tamagui/web/dist/cjs/index.cjs'),
    },
  },
})
