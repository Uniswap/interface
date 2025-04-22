import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import ms from 'ms'
import path from 'path'

if (process.env.CI !== 'true') {
  dotenv.config({ path: path.resolve(__dirname, '.env.local') })
}

const DEFAULT_TIMEOUT = ms('30s')

export default defineConfig({
  testDir: './src/pages',
  testMatch: '**/*.e2e.test.ts',
  fullyParallel: false,
  timeout: ms('10m'),
  reporter: process.env.CI && process.env.REPORT_TO_SLACK ? [['blob', 'list']] : 'list',
  expect: {
    timeout: DEFAULT_TIMEOUT,
  },
  use: {
    actionTimeout: DEFAULT_TIMEOUT,
    screenshot: 'off',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    baseURL: 'http://localhost:3000',
    headless: true,
    extraHTTPHeaders: {
      origin: 'http://localhost:3000',
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
