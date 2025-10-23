import { type BrowserContext, test as base, chromium } from '@playwright/test'
import { waitForExtensionLoad } from 'e2e/utils/wait-for-extension'
import path from 'path'

interface ExtensionFixtures {
  context: BrowserContext
  extensionId: string
}

export const freshExtensionTest = base.extend<ExtensionFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: fixture file
  context: async ({}, use) => {
    const extensionPath = path.join(__dirname, '../../build')

    // CI environments need different args for headless-like behavior
    const isCI = process.env.CI === 'true'

    const context = await chromium.launchPersistentContext('', {
      headless: false, // Chrome extensions require headed mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox', // Required for CI
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Overcome limited resource problems in CI
        ...(isCI ? ['--disable-gpu', '--disable-software-rasterizer'] : []),
      ],
      viewport: { width: 1280, height: 720 },
    })

    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    const { extensionId } = await waitForExtensionLoad(context, { timeout: 10000 })
    await use(extensionId)
  },
})

// Re-export the programmatic onboarded extension test fixture
export { onboardedExtensionTest } from './onboarded-extension.fixture'
