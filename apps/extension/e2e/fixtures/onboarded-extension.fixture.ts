/** biome-ignore-all lint/suspicious/noConsole: fixture file */
import { type BrowserContext, test as base, chromium } from '@playwright/test'
import { completeOnboarding } from 'e2e/utils/onboarding-helpers'
import { waitForExtensionLoad } from 'e2e/utils/wait-for-extension'
import path from 'path'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface OnboardedExtensionFixtures {
  context: BrowserContext
  extensionId: string
}

// Extension test fixture that programmatically completes onboarding
export const onboardedExtensionTest = base.extend<OnboardedExtensionFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: fixture file
  context: async ({}, use) => {
    const extensionPath = path.join(__dirname, '../../build')
    const isCI = process.env.CI === 'true'

    // Launch with a fresh temporary user data dir
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

    try {
      // Wait for extension to load and onboarding to appear
      const { onboardingPage } = await waitForExtensionLoad(context, {
        timeout: ONE_SECOND_MS * 10,
        waitForOnboarding: true,
      })

      // Complete onboarding programmatically
      if (onboardingPage) {
        await completeOnboarding(context, onboardingPage)
      } else {
        // Try to complete onboarding anyway - it might open later
        await completeOnboarding(context)
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      await context.close()
      throw error
    }

    await use(context)
    await context.close()
  },

  extensionId: async ({ context }, use) => {
    const { extensionId } = await waitForExtensionLoad(context, { timeout: ONE_SECOND_MS * 10 })
    await use(extensionId)
  },
})
