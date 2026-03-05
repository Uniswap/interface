import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    server: {
      deps: {
        inline: ['@tanstack/react-query', 'partysocket'],
      },
    },
    coverage: {
      exclude: [
        '**/__generated__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.*',
        '**/scripts/**',
        '**/.eslintrc.*',
      ],
    },
  },
})
