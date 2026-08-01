import { FeatureFlagClient, FeatureFlags, getFeatureFlagName } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()
const TEST_PASSPHRASE = 'e2e-test-passphrase-7f3a9b'
const EMBEDDED_WALLET_GATE = getFeatureFlagName(FeatureFlags.EmbeddedWallet, FeatureFlagClient.Web)

test.describe('/preview passphrase gate', () => {
  test.beforeEach(async ({ page }) => {
    // BetaPage redirects /preview to /?intro=true when the embedded_wallet gate is
    // enabled, and e2e builds evaluate the live Statsig value. A `featureFlagOverrideOff`
    // param directly on /preview can't win the race against that redirect (the override
    // is applied in an effect after Statsig initializes), so seed it on a separate
    // navigation first: the Statsig LocalOverrideAdapter persists overrides to
    // localStorage and reloads them on construction, so the subsequent /preview load
    // evaluates the gate as OFF from its very first render.
    await page.goto(`/?featureFlagOverrideOff=${EMBEDDED_WALLET_GATE}`)
    await page.waitForFunction(
      (gate) =>
        Object.keys(localStorage).some(
          (key) => key.startsWith('statsig.local-overrides.') && Boolean(localStorage.getItem(key)?.includes(gate)),
        ),
      EMBEDDED_WALLET_GATE,
    )
  })

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
