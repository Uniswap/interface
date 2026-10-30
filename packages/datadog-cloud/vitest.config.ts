import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['monitors/**/*.test.ts'],
    exclude: ['node_modules', 'bin', 'dashboards'],
  },
})
