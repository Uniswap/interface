import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __DEV__: 'true',
  },
  test: {
    watch: false,
    environment: 'edge-runtime',
    include: ['**/*.integration.test.ts'],
    testTimeout: 60000,
    hookTimeout: 120000,
  },
  resolve: {
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
