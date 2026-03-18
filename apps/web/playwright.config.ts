import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'
import ms from 'ms'
import path from 'path'

// Load environment variables from .env file
// This ensures the VSCode Playwright extension has access to env vars
config({ path: path.resolve(__dirname, '.env') })

const IS_CI = process.env.CI === 'true'

// Handle asset files and platform-specific imports for Node.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module')

// Override module resolution to handle platform-specific files like Vite does
const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent) {
  // For getConfig imports, try .web variant first (mimics Vite behavior)
  // Use precise matching to avoid false positives with modules containing 'getConfig' as substring
  if (request.endsWith('/getConfig') || request.endsWith('\\getConfig') || request === 'getConfig') {
    // Try different .web patterns to match how Vite resolves extensions
    const webVariants = [
      `${request}.web`,
      request.endsWith('.js') ? request.replace(/\.js$/, '.web.js') : `${request}.web.js`,
    ]

    for (const webVariant of webVariants) {
      try {
        return originalResolveFilename.call(this, webVariant, parent)
      } catch {
        // Continue trying other variants
      }
    }
  }

  return originalResolveFilename.call(this, request, parent)
}

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
