import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    environment: 'jsdom',
    coverage: {
      exclude: ['**/__generated__/**', '**/node_modules/**', '**/dist/**', '**/*.config.*', '**/scripts/**'],
    },
  },
})
