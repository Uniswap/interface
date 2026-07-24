import { expect } from '@playwright/test'
import { importedExtensionTest as test } from 'e2e/fixtures/imported-extension.fixture'
import { openExtensionSidebar, waitForBackgroundReady } from 'e2e/utils/extension-helpers'
import { unlockIfLocked } from 'e2e/utils/unlock-helpers'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// Shortened-address rendering of TEST_WALLET_ADDRESS (0xf39F...2266). The UI may insert a
// zero-width space after "0x" and either "..." or "…" in the middle.
const SHORTENED_TEST_ADDRESS_REGEX = /f39F(\.{3}|…)2266/

test.describe('Onboarding via seed phrase import', { tag: '@publish-gate' }, () => {
  test('sidebar shows the deterministic imported wallet', async ({ context, extensionId }) => {
    await waitForBackgroundReady(context)

    const sidebarPage = await openExtensionSidebar(context, extensionId)
    await sidebarPage.waitForLoadState('domcontentloaded')
    await unlockIfLocked(sidebarPage)

    // The home screen header shows the shortened address of the imported account,
    // proving the import produced the expected deterministic wallet (TEST_WALLET_ADDRESS).
    await expect(sidebarPage.getByText(SHORTENED_TEST_ADDRESS_REGEX).first()).toBeVisible({
      timeout: ONE_SECOND_MS * 30,
    })
  })
})
