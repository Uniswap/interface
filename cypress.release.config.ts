import { defineConfig } from 'cypress'

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  projectId: 'yp82ef',
  e2e: {
    specPattern: 'cypress/release.ts',
  },
})
