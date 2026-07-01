import path from 'path'
import { defineConfig, devices } from '@playwright/test'
import ms from 'ms'
import { loadTestRunnerEnv } from './vite/resolveEnvConfigs'

// Load env into process.env so the runner's getConfig() matches the browser bundle.
loadTestRunnerEnv(__dirname)

// __DEV__ is a build-time constant injected by Vite/Vitest; the Playwright
// worker has no such define so set it here to avoid loud errors from utilities/logger.ts
;(globalThis as Record<string, unknown>).__DEV__ ??= false

const IS_CI = process.env.CI === 'true'

// Handle asset files and platform-specific imports for Node.js
// oxlint-disable-next-line typescript/no-var-requires
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
  globalTeardown: './src/playwright/anvil/global-teardown.ts',
  workers: 1, // this is manually configured in the github action depending on type of tests
  fullyParallel: false,
  maxFailures: IS_CI ? 10 : undefined,
  retries: IS_CI ? 3 : 0,
  reporter: IS_CI && process.env.REPORT_TO_SLACK ? [['blob'], ['list']] : 'list',
  timeout: ms('120s'),
  expect: {
    timeout: ms('15s'),
  },
  use: {
    actionTimeout: ms('30s'),
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
