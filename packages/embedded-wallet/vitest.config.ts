import path from 'path'
import react from '@vitejs/plugin-react'
import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  ...vitestPreset,
  plugins: [react()],
  test: {
    ...vitestPreset.test,
    pool: 'forks',
    globals: true,
    environment: 'jsdom',
    // Use default web exports rather than react-native export conditions.
    environmentOptions: {
      jsdom: {
        customExportConditions: [],
      },
    },
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist'],
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
          /packages\/uniswap/,
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
      exclude: ['src/**/*.d.ts', '**/node_modules/**'],
    },
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    ...vitestPreset.resolve,
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@universe/embedded-wallet/src': path.resolve(__dirname, './src'),
      'uniswap/src': path.resolve(__dirname, '../uniswap/src'),
      'ui/src': path.resolve(__dirname, '../ui/src'),
      'utilities/src': path.resolve(__dirname, '../utilities/src'),
      'react-native': 'react-native-web',
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
    include: ['react-native-web'],
  },
})
