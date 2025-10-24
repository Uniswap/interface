import { type BrowserContext, chromium } from '@playwright/test'
import os from 'os'
import path from 'path'

interface CreateExtensionContextOptions {
  /** Prefix for the user data directory (for test isolation) */
  userDataDirPrefix?: string
}

/**
 * Creates a persistent browser context with the extension loaded.
 * Returns both the context and cleanup function.
 */
export async function createExtensionContext(options: CreateExtensionContextOptions = {}): Promise<BrowserContext> {
  const { userDataDirPrefix = 'playwright-extension' } = options

  const extensionPath = path.join(__dirname, '../../build')

  // Generate a unique user data directory for each test to ensure isolation
  const userDataDir = path.join(
    os.tmpdir(),
    `${userDataDirPrefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  )

  // CI environments need different args for headless-like behavior
  const isCI = process.env.CI === 'true'

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Chrome extensions require headed mode
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-default-browser-check',
      '--disable-default-apps',
      '--no-sandbox', // Required for CI
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Overcome limited resource problems in CI
      ...(isCI ? ['--disable-gpu', '--disable-software-rasterizer'] : []),
    ],
    viewport: { width: 1280, height: 720 },
  })

  return context
}
