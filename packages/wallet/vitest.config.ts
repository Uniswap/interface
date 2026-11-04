import path from 'path'
import react from '@vitejs/plugin-react'
import { withRnPrimitives } from 'vitest-presets/vitest/rn-primitives.js'
import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'
import { defineConfig } from 'vitest/config'

const config = defineConfig({
  ...vitestPreset,
  plugins: [react()],
  test: {
    ...vitestPreset.test,
    pool: 'forks',
    globals: true,
    environment: 'jsdom',
    // Override the preset's jsdom customExportConditions to avoid loading React Native modules
    environmentOptions: {
      jsdom: {
        // Don't use react-native export conditions - use default web exports
        customExportConditions: [],
      },
    },
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'src/**/*.stories.**', 'src/abis/**'],
    testTimeout: 15000,
    // Vitest's console interceptor calls Date.now() on every console write, which breaks
    // tests that stub Date.now with an incrementing counter (e.g. submitOrderSaga.test.ts)
    disableConsoleIntercept: true,
    reporters: ['verbose'],
    coverage: {
      include: ['src/**/*.{js,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.**',
        'src/abis/**', // auto-generated abis
        '**/node_modules/**',
      ],
    },
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    ...vitestPreset.resolve,
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      // React Native aliases for testing
      'react-native': 'react-native-web',
      'react-native-gesture-handler': path.resolve(__dirname, '../../node_modules/react-native-gesture-handler'),
    },
  },
  optimizeDeps: {
    ...vitestPreset.optimizeDeps,
    include: ['react-native-web', '@testing-library/react-native'],
  },
})

export default withRnPrimitives(config)
