import codeCoverageTask from '@cypress/code-coverage/task'
import { defineConfig } from 'cypress'
import { setupHardhatEvents } from 'cypress-hardhat'
import { unlinkSync } from 'fs'

export default defineConfig({
  projectId: 'yp82ef',
  defaultCommandTimeout: 24000, // 2x average block time
  chromeWebSecurity: false,
  experimentalMemoryManagement: true, // better memory management, see https://github.com/cypress-io/cypress/pull/25462
  retries: { runMode: 2 },
  videoCompression: false,
  e2e: {
    async setupNodeEvents(on, config) {
      await setupHardhatEvents(on, config)
      codeCoverageTask(on, config)

      // Delete recorded videos for specs that passed without flakes.
      on('after:spec', async (spec, results) => {
        if (results && results.video) {
          // If there were no failures (including flakes), delete the recorded video.
          if (!results.tests?.some((test) => test.attempts.some((attempt) => attempt?.state === 'failed'))) {
            unlinkSync(results.video)
          }
        }
      })

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
