import { expect, type Page } from '@playwright/test'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Approves the connection request in the sidebar if an approval card renders.
 *
 * Onboarding pre-authorizes app.uniswap.org (useFinishExtensionOnboarding), so
 * connection requests from the Uniswap app are auto-approved and normally no
 * approval card renders — the `connected` signal resolves first. Pending dapp
 * requests are scoped to a single sidebar instance and are not persisted, so an
 * approval card can only come from the live request.
 *
 * This is the canonical resilient pattern for publish-gate specs: race the
 * extension's own success signal against the optional approval UI and only
 * interact with the UI if it actually appears. Never unconditionally `waitFor`
 * an approval card — a pre-authorized origin won't render one.
 */
export async function approveConnectionInSidebarIfPrompted(
  sidebarPage: Page,
  connected: Promise<unknown>,
): Promise<void> {
  const confirmButton = sidebarPage.getByTestId(TestID.Confirm)

  const outcome = await Promise.race([
    // A rejected connection is surfaced where the caller awaits/asserts `connected`.
    connected.then(
      () => 'connected' as const,
      () => 'connected' as const,
    ),
    confirmButton.waitFor({ state: 'visible', timeout: ONE_SECOND_MS * 20 }).then(
      () => 'prompted' as const,
      () => 'no-prompt' as const,
    ),
  ])

  if (outcome === 'prompted') {
    await expect(confirmButton).toBeEnabled({ timeout: ONE_SECOND_MS * 10 })
    await confirmButton.click()
  }
}
