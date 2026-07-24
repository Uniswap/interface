import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    tsconfigPaths({
      // ignores tsconfig files in Nx generator template directories
      skip: (dir) => dir.includes('files'),
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    // Serves canned GraphQL gateway responses to the dev-server worker when
    // CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE targets localhost (CI does).
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
