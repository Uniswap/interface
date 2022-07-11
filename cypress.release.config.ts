import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'yp82ef',
  e2e: {
    specPattern: 'cypress/release.ts',
  },
})
