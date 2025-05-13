import { expect, test } from 'playwright/fixtures'
import { FeatureFlagClient, FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

// Note: only run critical tests in this file
// this file will block merging PRs if it fails
// More comprehensive tests should be located in web/src/pages/**.e2e.test.ts

test.describe('App', () => {
  test('should load swap page', async ({ page }) => {
    await page.goto('/swap')
    await expect(page.getByTestId(TestID.ChooseInputToken)).toBeVisible()
  })

  test('statsig is healthy', async ({ page }) => {
    const flagName = getFeatureFlagName(FeatureFlags.DummyFlagTest, FeatureFlagClient.Web)

    await page.goto('/swap')
    await page.getByTestId(TestID.DevFlagsBox).click()
    await page.getByTestId(TestID.DevFlagsSettingsToggle).click()
    // dummy flag should be enabled by default
    const isEnabled = await page.locator(`#${flagName}`).inputValue()
    await expect(isEnabled).toBe('Enabled')
    // disable the flag
    await page.locator(`#${flagName}`).selectOption('Disabled')
    await expect(page.getByText(`${flagName}: false`)).toBeVisible()
    const isDisabled = await page.locator(`#${flagName}`).inputValue()
    await expect(isDisabled).toBe('Disabled')
  })
})
