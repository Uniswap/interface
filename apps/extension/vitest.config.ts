import path from 'path'
import react from '@vitejs/plugin-react'
import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'
import { defineConfig } from 'vitest/config'

// Set APP_ID at config-load time so it's inherited by all forked workers
// before @universe/config is evaluated. Overrides the default ('web') in
// config/vitest-presets/vitest/globals.js.
process.env.APP_ID = 'extension'

export default defineConfig({
  ...vitestPreset,
  plugins: [react()],
  test: {
    ...vitestPreset.test,
    name: 'Extension Wallet',
    pool: 'forks',
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 2,
      },
    },
    globals: true,
    environment: 'jsdom',
    // Override the preset's jsdom customExportConditions to avoid loading React Native modules;
    // the extension resolves react-native-web everywhere.
    environmentOptions: {
      jsdom: {
        customExportConditions: [],
      },
    },
    env: {
      ...vitestPreset.test.env,
      APP_ID: 'extension',
    },
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.{spec,test}.{js,jsx,ts,tsx}', 'config/**/*.{spec,test}.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', 'src/**/*.stories.**'],
    testTimeout: 15000,
    server: {
      deps: {
        inline: [
          /ui\/src\/theme/,
          /packages\/ui/,
          /packages\/utilities/,
          /packages\/uniswap/,
          /packages\/wallet/,
          /tamagui/,
          /@react-navigation\/core/,
          /@react-navigation\/native/,
          /@react-navigation\/elements/,
          // React Native ecosystem packages ship untranspiled Flow/ESM sources; inline them so
          // vite transforms them and the react-native -> react-native-web alias applies
          // (mirrors the jest config's transformIgnorePatterns).
          /node_modules\/react-native\//,
          /node_modules\/react-native-[^/]+\//,
          /node_modules\/@react-native\//,
          /node_modules\/@react-native-community\//,
          /node_modules\/@react-native-masked-view\//,
          /node_modules\/expo(-[^/]+)?\//,
          /node_modules\/@gorhom\//,
          /node_modules\/moti\//,
        ],
        fallbackCJS: true,
      },
    },
    coverage: {
      include: [
        'src/app/**/*.{js,ts,tsx}',
        'src/background/**/*.{js,ts,tsx}',
        'src/contentScript/**/*.{js,ts,tsx}',
        'config/**/*.{js,ts,tsx}',
      ],
      exclude: ['src/**/*.stories.**', '**/node_modules/**'],
    },
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    ...vitestPreset.resolve,
    extensions: ['.web.ts', '.web.tsx', '.web.js', '.web.jsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: [
      { find: /^src\//, replacement: `${path.resolve(__dirname, './src')}/` },
      { find: /^uniswap\/src\//, replacement: `${path.resolve(__dirname, '../../packages/uniswap/src')}/` },
      { find: /^ui\/src/, replacement: path.resolve(__dirname, '../../packages/ui/src') },
      { find: /^utilities\/src\//, replacement: `${path.resolve(__dirname, '../../packages/utilities/src')}/` },
      { find: /^wallet\/src\//, replacement: `${path.resolve(__dirname, '../../packages/wallet/src')}/` },

      // React Native aliases for testing
      { find: 'react-native', replacement: 'react-native-web' },
      // Exact-match tamagui entry points to their CJS builds (subpath imports like
      // @tamagui/core/reset.css must keep resolving normally)
      {
        find: /^@tamagui\/core$/,
        replacement: path.resolve(__dirname, '../../node_modules/@tamagui/core/dist/cjs/index.cjs'),
      },
      {
        find: /^@tamagui\/web$/,
        replacement: path.resolve(__dirname, '../../node_modules/@tamagui/web/dist/cjs/index.cjs'),
      },
      {
        find: /^@tamagui\/use-direction$/,
        replacement: path.resolve(__dirname, '../../node_modules/@tamagui/use-direction/dist/cjs/index.cjs'),
      },
      {
        find: /^@tamagui\/use-callback-ref$/,
        replacement: path.resolve(__dirname, '../../node_modules/@tamagui/use-callback-ref/dist/cjs/index.cjs'),
      },
      {
        find: /^tamagui\/linear-gradient$/,
        replacement: path.resolve(__dirname, '../../node_modules/tamagui/dist/cjs/linear-gradient.cjs'),
      },
      { find: /^tamagui$/, replacement: path.resolve(__dirname, '../../node_modules/tamagui/dist/cjs/index.cjs') },
    ],
  },
  optimizeDeps: {
    ...vitestPreset.optimizeDeps,
    include: ['react-native-web'],
  },
})
