import { defineConfig } from 'cypress'
import { setupHardhatEvents } from 'cypress-hardhat'

export default defineConfig({
  projectId: 'yp82ef',
  defaultCommandTimeout: 24000, // 2x average block time
  chromeWebSecurity: false,
  experimentalMemoryManagement: true, // better memory management, see https://github.com/cypress-io/cypress/pull/25462
  retries: { runMode: process.env.CYPRESS_RETRIES ? +process.env.CYPRESS_RETRIES : 1 },
  e2e: {
    async setupNodeEvents(on, config) {
      await setupHardhatEvents(on, config)
      return config
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/{e2e,staging}/**/*.test.ts',
  },
})
