import { type BrowserContext, test as base } from '@playwright/test'
import { createExtensionContext } from 'e2e/fixtures/extension-context'
import { waitForExtensionLoad } from 'e2e/utils/wait-for-extension'

interface ExtensionFixtures {
  context: BrowserContext
  extensionId: string
}

export const freshExtensionTest = base.extend<ExtensionFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: fixture file
  context: async ({}, use) => {
    const context = await createExtensionContext()
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
