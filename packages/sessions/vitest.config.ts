import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/__generated__/**', '**/node_modules/**', '**/dist/**', '**/*.config.*', '**/scripts/**'],
    },
  },
})
