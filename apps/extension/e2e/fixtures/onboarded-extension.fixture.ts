/** biome-ignore-all lint/suspicious/noConsole: fixture file */
import { type BrowserContext, test as base } from '@playwright/test'
import { createExtensionContext } from 'e2e/fixtures/extension-context'
import { completeOnboarding } from 'e2e/utils/onboarding-helpers'
import { waitForExtensionLoad } from 'e2e/utils/wait-for-extension'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface OnboardedExtensionFixtures {
  context: BrowserContext
  extensionId: string
}

// Extension test fixture that programmatically completes onboarding
export const onboardedExtensionTest = base.extend<OnboardedExtensionFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: fixture file
  context: async ({}, use) => {
    const context = await createExtensionContext({
      userDataDirPrefix: 'playwright-extension-onboarded',
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
