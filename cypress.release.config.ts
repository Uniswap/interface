import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'yp82ef',
  videoUploadOnPasses: false,
  pageLoadTimeout: 60000,
  retries: 30,
  e2e: {
    specPattern: 'cypress/release.ts',
  },
})
