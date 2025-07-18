import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import ms from 'ms'
import path from 'path'

if (process.env.CI !== 'true') {
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
  // TODO: WEB-7311 - Increase number of workers
  workers: 1,
  fullyParallel: true,
  reporter: process.env.CI && process.env.REPORT_TO_SLACK ? [['blob', 'list']] : 'list',
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
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: './test-results',
})
