import codeCoverageTask from '@cypress/code-coverage/task'
import { defineConfig } from 'cypress'
import { setupHardhatEvents } from 'cypress-hardhat'

export default defineConfig({
  projectId: 'yp82ef',
  videoUploadOnPasses: false,
  waitForAnimations: false,
  defaultCommandTimeout: 24000, // 2x average block time
  chromeWebSecurity: false,
  retries: { runMode: 2 },
  e2e: {
    async setupNodeEvents(on, config) {
      await setupHardhatEvents(on, config)
      codeCoverageTask(on, config)
      return {
        ...config,
        // Only enable Chrome.
        // Electron (the default) has issues injecting window.ethereum before pageload, so it is not viable.
        browsers: config.browsers.filter(({ name }) => name === 'chrome'),
      }
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
