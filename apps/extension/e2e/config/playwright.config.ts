import { defineConfig } from '@playwright/test'
import ms from 'ms'

// oxlint-disable-next-line eslint-js/no-restricted-syntax allow process.env access
const IS_CI = process.env.CI === 'true'

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
