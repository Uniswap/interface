import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    // Serves canned gateway responses to the dev-server worker when
    // CLOUD_FUNCTIONS_DATA_API_ENDPOINT_OVERRIDE targets localhost (CI does).
    globalSetup: ['./functions/fixtures/globalSetup.ts'],
    testTimeout: 360000,
    retry: 3,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  // Relative to the web root
  cacheDir: './node_modules/.cache/cloud-vitest',
})
