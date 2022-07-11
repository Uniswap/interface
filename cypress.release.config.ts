import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'yp82ef',
  pageLoadTimeout: 60000,
  retries: 30,
  e2e: {
    specPattern: 'cypress/release.ts',
  },
})
