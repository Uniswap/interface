import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest-setup.ts'],
    coverage: {
      exclude: ['**/__generated__/**', '**/node_modules/**', '**/dist/**', '**/*.config.*', '**/scripts/**'],
    },
  },
  resolve: {
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
