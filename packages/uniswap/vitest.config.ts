import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'
import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'

export default defineConfig({
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
        /tamagui/,
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
          /tamagui/,
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
      '@tamagui/core': path.resolve(__dirname, '../../node_modules/@tamagui/core/dist/cjs/index.cjs'),
      '@tamagui/web': path.resolve(__dirname, '../../node_modules/@tamagui/web/dist/cjs/index.cjs'),
      '@tamagui/use-direction': path.resolve(__dirname, '../../node_modules/@tamagui/use-direction/dist/cjs/index.cjs'),
      '@tamagui/use-callback-ref': path.resolve(
        __dirname,
        '../../node_modules/@tamagui/use-callback-ref/dist/cjs/index.cjs',
      ),
      'tamagui/linear-gradient': path.resolve(__dirname, '../../node_modules/tamagui/dist/cjs/linear-gradient.cjs'),
      tamagui: path.resolve(__dirname, '../../node_modules/tamagui/dist/cjs/index.cjs'),
    },
  },
  optimizeDeps: {
    ...vitestPreset.optimizeDeps,
    include: ['react-native-web', '@testing-library/react-native'],
  },
})
