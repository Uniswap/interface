import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'threads',
    globals: true,
    environment: 'jsdom',
    // process.env.APP_ID is sourced from apps/web/.env, but Vitest does not
    // auto-inject non-VITE_ prefixed .env vars into the test process's process.env.
    env: {
      APP_ID: 'web',
    },
    setupFiles: ['./src/setupTests.ts', './vite/mockAssets.tsx'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'vite/**/*.test.ts'],
    exclude: [
      'e2e',
      '**/*.e2e.test.ts',
      '**/*.e2e.test.tsx',
      '**/e2e/**',
      'node_modules',
      'dist',
      '.next',
      '.turbo',
      '.nx',
    ],
    testTimeout: 15000,
    deps: {
      inline: [/packages\/ui/, /packages\/utilities/, /packages\/uniswap/],
    },
    reporters: ['verbose'],
    coverage: {
      include: ['src/**/*.ts*'],
      exclude: [
        'src/**/*.d.ts',
        'src/abis/types/**',
        'src/constants/**/*.ts',
        'src/graphql/**/__generated__/**',
        'src/locales/**',
        'src/test-utils/**',
        'src/types/v3/**',
        'src/playwright/**',
        '**/*.snap',
      ],
    },
  },
  define: {
    __DEV__: true,
  },
  build: {
    sourcemap: false,
  },
  esbuild: {
    sourcemap: false,
  },
  plugins: [react()],
  optimizeDeps: {
    include: ['ui/src', 'utilities/src', 'uniswap/src'],
    exclude: ['d3-array'],
  },
  resolve: {
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: [
      // Tilde prefix for src directory
      { find: /^~\/(.*)$/, replacement: path.resolve(__dirname, 'src/$1') },
      // Use web app-specific i18n entry that doesn't import wallet's i18n-setup (must be before general uniswap/src alias)
      {
        find: /^uniswap\/src\/i18n$/,
        replacement: path.resolve(__dirname, '../../packages/uniswap/src/i18n/index.web-app.ts'),
      },
      { find: 'ui/src', replacement: path.resolve(__dirname, '../../packages/ui/src') },
      { find: 'utilities/src', replacement: path.resolve(__dirname, '../../packages/utilities/src') },
      { find: 'uniswap/src', replacement: path.resolve(__dirname, '../../packages/uniswap/src') },
      { find: 'd3-array', replacement: path.resolve(__dirname, '../../node_modules/d3-array/dist/d3-array.min.js') },
      { find: 'react-native', replacement: 'react-native-web' },
      { find: 'react-native-gesture-handler', replacement: require.resolve('react-native-gesture-handler') },
    ],
  },
})
