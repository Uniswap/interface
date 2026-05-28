import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    environment: 'edge-runtime',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Exclude real backend integration tests - these run in a separate optional CI workflow
      '**/session.integration.test.ts',
    ],
    coverage: {
      exclude: ['**/__generated__/**', '**/node_modules/**', '**/dist/**', '**/*.config.*', '**/scripts/**'],
    },
  },
  resolve: {
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
