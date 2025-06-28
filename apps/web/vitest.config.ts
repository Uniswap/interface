import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'threads',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts', './vite/mockAssets.tsx'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e', '**/*.e2e.test.ts', '**/*.e2e.test.tsx', '**/e2e/**', 'node_modules', 'dist', '.next', '.turbo'],
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
  plugins: [react(), nodePolyfills({ protocolImports: true })],
  optimizeDeps: {
    include: ['ui/src', 'utilities/src', 'uniswap/src'],
    exclude: ['d3-array'],
  },
  resolve: {
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      'ui/src': path.resolve(__dirname, '../../packages/ui/src'),
      'utilities/src': path.resolve(__dirname, '../../packages/utilities/src'),
      'uniswap/src': path.resolve(__dirname, '../../packages/uniswap/src'),

      components: path.resolve(__dirname, 'src/components'),
      constants: path.resolve(__dirname, 'src/constants'),
      graphql: path.resolve(__dirname, 'src/graphql'),
      appGraphql: path.resolve(__dirname, 'src/appGraphql'),
      featureFlags: path.resolve(__dirname, 'src/featureFlags'),
      dev: path.resolve(__dirname, 'src/dev'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      lib: path.resolve(__dirname, 'src/lib'),
      pages: path.resolve(__dirname, 'src/pages'),
      state: path.resolve(__dirname, 'src/state'),
      theme: path.resolve(__dirname, 'src/theme'),
      types: path.resolve(__dirname, 'src/types'),
      utils: path.resolve(__dirname, 'src/utils'),
      'test-utils': path.resolve(__dirname, 'src/test-utils'),
      connection: path.resolve(__dirname, 'src/connection'),
      nft: path.resolve(__dirname, 'src/nft'),
      tracing: path.resolve(__dirname, 'src/tracing'),
      rpc: path.resolve(__dirname, 'src/rpc'),
      assets: path.resolve(__dirname, 'src/assets'),
      polyfills: path.resolve(__dirname, 'src/polyfills'),
      setupRive: path.resolve(__dirname, 'src/setupRive'),

      'd3-array': path.resolve(__dirname, '../../node_modules/d3-array/dist/d3-array.min.js'),
      'react-native': 'react-native-web',
      'react-native-gesture-handler': require.resolve('react-native-gesture-handler'),

      http: 'stream-http',
      https: 'https-browserify',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      buffer: 'buffer',
      process: 'process/browser',
      path: 'path-browserify',
    },
  },
})
