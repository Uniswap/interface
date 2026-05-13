import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Unit tests only — `*.integration.test.ts` runs via vitest.integration.config.ts
    // (different environment, hits live infra, needs a longer hookTimeout).
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'src/**/*.integration.test.ts'],
  },
})
