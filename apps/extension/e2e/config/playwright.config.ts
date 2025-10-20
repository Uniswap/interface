import { defineConfig } from '@playwright/test'
import ms from 'ms'

const IS_CI = process.env.CI === 'true'

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  testDir: '../tests',
  testMatch: '**/*.test.ts',
  workers: 1,
  fullyParallel: false, // Extensions need sequential loading
  maxFailures: IS_CI ? 10 : undefined,
  retries: IS_CI ? 3 : 0,
  reporter: 'list',
  timeout: ms('60s'),
  expect: {
    timeout: ms('10s'),
  },
  use: {
    screenshot: 'off',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    headless: false, // Chrome extensions require headed mode
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },
  },
  outputDir: '../test-results',
})
