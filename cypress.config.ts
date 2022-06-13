import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'yp82ef',
  video: false,
  defaultCommandTimeout: 10000,
  chromeWebSecurity: false,
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
