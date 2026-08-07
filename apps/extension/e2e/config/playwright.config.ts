import { defineConfig } from '@playwright/test'
import ms from 'ms'

// oxlint-disable-next-line eslint-js/no-restricted-syntax -- allow process.env access
const IS_CI = process.env.CI === 'true'
// oxlint-disable-next-line eslint-js/no-restricted-syntax -- allow process.env access
const REPORT_TO_SLACK = Boolean(process.env['REPORT_TO_SLACK'])

export default defineConfig({
  testDir: '../tests',
  testMatch: '**/*.test.ts',
  workers: 1,
  fullyParallel: false, // Extensions need sequential loading
  maxFailures: IS_CI ? 10 : undefined,
  retries: IS_CI ? 3 : 0,
  // Emit a blob report (in addition to the console list) when a scheduled/dispatch run
  // asks for it, so shards can be merged and posted to Slack by ./.github/actions/playwright_finish.
  // Path is resolved relative to this config's directory → apps/extension/blob-report.
  reporter: IS_CI && REPORT_TO_SLACK ? [['blob', { outputDir: '../../blob-report' }], ['list']] : 'list',
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
