import path from 'path'
import react from '@vitejs/plugin-react'
import { withRnPrimitives } from 'vitest-presets/vitest/rn-primitives.js'
import { defineConfig } from 'vitest/config'
import vitestGlobals from '../../config/vitest-presets/vitest/globals.js'

const config = defineConfig({
  test: {
    pool: 'threads',
    globals: true,
    environment: 'jsdom',
    // Unit tests don't run config:pull, so the app config is sourced from the shared
    // test-env placeholders (Vitest injects these into process.env; getConfig() reads them).
    env: {
      ...vitestGlobals.globals,
      NODE_ENV: 'test',
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
    server: {
      deps: {
        inline: [/packages\/ui/, /packages\/utilities/, /packages\/uniswap/],
      },
    },
    reporters: ['verbose'],
    coverage: {
      include: ['src/**/*.ts*'],
      exclude: [
        'src/**/*.d.ts',
        'src/abis/types/**',
        'src/constants/**/*.ts',
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
      // resolve.extensions omits `.web.js`, so the bare specifier would land on the native
      // leg's Fabric internals; the app build resolves the web leg the same way.
      {
        find: /^react-native-svg$/,
        replacement: path.resolve(__dirname, '../../node_modules/react-native-svg/lib/module/elements.web.js'),
      },
    ],
  },
})

export default withRnPrimitives(config)
