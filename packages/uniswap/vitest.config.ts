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
    deps: {
      inline: [
        /ui\/src\/theme/,
        /packages\/ui/,
        /packages\/utilities/,
        /packages\/uniswap/,
        /@testing-library\/react-native/,
        /@react-navigation\/core/,
        /@react-navigation\/native/,
      ],
    },
    server: {
      deps: {
        inline: [
          /ui\/src\/theme/,
          /packages\/ui/,
          /packages\/utilities/,
          /@testing-library\/react-native/,
          /@react-navigation\/core/,
          /@react-navigation\/native/,
        ],
        fallbackCJS: true,
      },
    },
    reporters: ['verbose'],
    coverage: {
      include: ['src/**/*.{js,ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.stories.**', 'src/abis/**', '**/node_modules/**'],
    },
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    ...vitestPreset.resolve,
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      'uniswap/src': path.resolve(__dirname, './src'),
      'ui/src': path.resolve(__dirname, '../ui/src'),
      'utilities/src': path.resolve(__dirname, '../utilities/src'),

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
