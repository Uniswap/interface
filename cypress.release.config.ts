import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'yp82ef',
  video: false,
  e2e: {
    specPattern: 'cypress/release.ts',
  },
})
