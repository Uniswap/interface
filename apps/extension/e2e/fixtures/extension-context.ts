import os from 'os'
import path from 'path'
import { type BrowserContext, chromium } from '@playwright/test'

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

  // Default to the WXT output directory. A different build can be loaded by setting
  // EXTENSION_BUILD_DIR. Using `||` (not `??`) so an empty-string env var falls through
  // to the default.
  // oxlint-disable-next-line eslint-js/no-restricted-syntax allow process.env access
  const extensionPath = process.env['EXTENSION_BUILD_DIR'] || path.join(__dirname, '../../.output/chrome-mv3')

  // Generate a unique user data directory for each test to ensure isolation
  const userDataDir = path.join(
    os.tmpdir(),
    `${userDataDirPrefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  )

  // CI environments need different args for headless-like behavior
  // oxlint-disable-next-line eslint-js/no-restricted-syntax allow process.env access
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
