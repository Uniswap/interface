import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()
const TEST_PASSPHRASE = 'e2e-test-passphrase-7f3a9b'

test.describe('/preview passphrase gate', () => {
  test('shows passphrase modal on /preview', async ({ page }) => {
    await page.goto('/preview')
    await expect(page.getByTestId(TestID.PreviewPassphraseInput)).toBeVisible()
    await expect(page.getByText('Uniswap Preview')).toBeVisible()
    await expect(page.getByTestId(TestID.PreviewPassphraseSubmit)).toBeDisabled()
  })

  test('shows error on wrong passphrase', async ({ page }) => {
    await page.goto('/preview')
    await page.getByTestId(TestID.PreviewPassphraseInput).fill('wrong')
    await page.getByTestId(TestID.PreviewPassphraseSubmit).click()
    await expect(page.getByTestId(TestID.PreviewPassphraseError)).toBeVisible()
  })

  test('navigates to /swap on correct passphrase', async ({ page }) => {
    // Bypass Statsig dynamic config by patching Array.prototype.includes globally.
    // The validate() function calls validCodes.includes(passphrase) — this makes it
    // return true for our unique test passphrase, cutting Statsig out of the loop.
    // NOTE: This is a global prototype mutation scoped to this test's page context only.
    // The passphrase value is intentionally unique to avoid colliding with other .includes() calls.
    await page.addInitScript((passphrase) => {
      const originalIncludes = Array.prototype.includes
      Array.prototype.includes = function (searchElement: unknown, fromIndex?: number) {
        if (searchElement === passphrase) {
          return true
        }
        return originalIncludes.call(this, searchElement, fromIndex)
      }
    }, TEST_PASSPHRASE)

    await page.goto('/preview')
    await page.getByTestId(TestID.PreviewPassphraseInput).fill(TEST_PASSPHRASE)
    await page.getByTestId(TestID.PreviewPassphraseSubmit).click()
    await expect(page).toHaveURL(/\/\?intro=true/)
  })
})
