import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/pages',
  testMatch: '**/*.e2e.test.ts',
  fullyParallel: true,
  timeout: 60000,
  reporter:
    process.env.CI && process.env.REPORT_TO_SLACK
      ? [
          [
            require.resolve('playwright-slack-report/dist/src/SlackReporter.js'),
            {
              slackWebHookUrl: process.env.SLACK_WEBHOOK_URL,
              sendResults: 'always',
            },
          ],
          ['list'],
        ]
      : 'list',
  use: {
    screenshot: 'on',
    video: 'on',
    trace: 'on',
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
  outputDir: './src/playwright/test-results',
})
