/* oxlint-disable react/rules-of-hooks -- Playwright fixtures use use() which is not a React hook */
import { type BrowserContext, test as base } from '@playwright/test'
import { createExtensionContext } from 'e2e/fixtures/extension-context'
import { completeOnboardingViaImport } from 'e2e/utils/onboarding-helpers'
import { waitForExtensionLoad } from 'e2e/utils/wait-for-extension'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface ImportedExtensionFixtures {
  context: BrowserContext
  extensionId: string
}

/**
 * Extension test fixture that completes onboarding by importing the canonical public
 * Hardhat/Anvil dev mnemonic, so every run gets the same deterministic wallet
 * (see TEST_WALLET_ADDRESS in e2e/utils/onboarding-helpers.ts).
 */
export const importedExtensionTest = base.extend<ImportedExtensionFixtures>({
  // oxlint-disable-next-line no-empty-pattern -- fixture file
  context: async ({}, use) => {
    const context = await createExtensionContext({
      userDataDirPrefix: 'playwright-extension-imported',
    })

    try {
      const { onboardingPage } = await waitForExtensionLoad(context, {
        timeout: ONE_SECOND_MS * 10,
        waitForOnboarding: true,
      })

      await completeOnboardingViaImport(context, { existingOnboardingPage: onboardingPage ?? undefined })
    } catch (error) {
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
