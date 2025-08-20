import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import ms from 'ms'
import path from 'path'

const IS_CI = process.env.CI === 'true'

if (!IS_CI) {
  dotenv.config({ path: path.resolve(__dirname, '.env.local') })
}

// Handle asset files that Node.js can't parse
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module')
const originalLoad = Module._load
Module._load = function (...args: any[]) {
  const [request] = args
  if (request.match(/\.(png|svg|mp4)$/)) {
    return `mock-${path.basename(request)}`
  }
  return originalLoad.apply(this, args)
}

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.e2e.test.ts',
  workers: 1, // this is manually configured in the github action depending on type of tests
  fullyParallel: true,
  maxFailures: IS_CI ? 10 : undefined,
  retries: IS_CI ? 3 : 0,
  reporter: IS_CI && process.env.REPORT_TO_SLACK ? [['blob'], ['list']] : 'list',
  timeout: ms('60s'),
  expect: {
    timeout: ms('10s'),
  },
  use: {
    screenshot: 'off',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    baseURL: 'http://localhost:3000',
    headless: true,
    extraHTTPHeaders: {
      origin: 'http://localhost:3000',
    },
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: './test-results',
})
