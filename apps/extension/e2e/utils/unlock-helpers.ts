import type { Page } from '@playwright/test'
import { isVisibleWithin } from 'e2e/utils/locator-helpers'
import { TEST_PASSWORD } from 'e2e/utils/onboarding-helpers'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Unlocks the extension UI (sidebar/popup) with the test password if the lock screen is
 * showing. No-op when the wallet is already unlocked.
 */
export async function unlockIfLocked(page: Page, password: string = TEST_PASSWORD): Promise<void> {
  const passwordInput = page.locator('input[type="password"]').first()

  const isLocked = await isVisibleWithin(passwordInput, ONE_SECOND_MS * 3)
  if (!isLocked) {
    return
  }

  await passwordInput.fill(password)
  await page.getByTestId(TestID.Submit).click()
  await passwordInput.waitFor({ state: 'detached', timeout: ONE_SECOND_MS * 10 })
}
