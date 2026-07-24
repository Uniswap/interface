import path from 'path'
import react from '@vitejs/plugin-react'
import { transformWithEsbuild } from 'vite'
import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'
import { defineConfig } from 'vitest/config'

// Some RN ecosystem packages ship untranspiled JSX in .js files (babel-jest handled these)
const RN_JSX_PACKAGES = ['react-native-markdown-display']

export default defineConfig({
  ...vitestPreset,
  plugins: [
    react(),
    {
      name: 'rn-untranspiled-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (id.endsWith('.js') && RN_JSX_PACKAGES.some((pkg) => id.includes(`node_modules/${pkg}/`))) {
          return transformWithEsbuild(code, id, { loader: 'jsx' })
        }
        return null
      },
    },
  ],
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
    setupFiles: ['./vitest-setup.ts', './vitest-setup-overrides.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'src/**/*.stories.**'],
    testTimeout: 15000,
    // Vitest's console interceptor calls Date.now() on every console write, which breaks
    // tests that stub Date.now with an incrementing counter (see the wallet migration)
    disableConsoleIntercept: true,
    server: {
      deps: {
        // react-navigation ships untranspiled .js (Flow "typeof" imports); inline it so vite
        // transforms it and so the vitest-setup vi.mock('@react-navigation/native') applies.
        // Wallet doesn't need this because it doesn't use react-navigation.
        inline: [/@react-navigation\/core/, /@react-navigation\/native/],
      },
    },
    reporters: ['verbose'],
    coverage: {
      include: ['src/**/*.{js,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.**',
        'src/test/**', // test helpers
        '**/node_modules/**',
      ],
    },
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    ...vitestPreset.resolve,
    // Mirror jest-expo's haste platform resolution (ios/native before plain); mobile's jest config
    // deliberately did NOT prioritize .web
    extensions: [
      '.ios.ts',
      '.ios.tsx',
      '.native.ts',
      '.native.tsx',
      '.ts',
      '.tsx',
      '.web.ts',
      '.web.tsx',
      '.js',
      '.jsx',
      '.json',
    ],
    alias: {
      // Mobile absolute imports
      src: path.resolve(__dirname, './src'),
      // Use the transpiled ESM build (its 'react-native' entry points at untranspiled src)
      'react-native-wagmi-charts': path.resolve(
        __dirname,
        '../../node_modules/react-native-wagmi-charts/lib/module/index.js',
      ),
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
