import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    environment: 'edge-runtime',
    include: ['**/session.integration.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
  resolve: {
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
