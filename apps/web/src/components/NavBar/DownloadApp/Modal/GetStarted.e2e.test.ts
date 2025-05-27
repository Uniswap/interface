import { expect, test } from 'playwright/fixtures'
import { setupWebAuthn } from 'playwright/mocks/webAuthn'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const UNITAG_NAME = 'newunitag'
test('sign up a user', async ({ page }) => {
  await setupWebAuthn(page)

  await page.goto(`${uniswapUrls.embeddedWalletUrl}/?eagerlyConnect=false&featureFlagOverride=embedded_wallet`)

  // stub the response for unitag
  await page.route(`${uniswapUrls.unitagsApiUrl}/username?username=${UNITAG_NAME}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({ available: true, requiresEnsMatch: false }),
    })
  })

  await page.getByTestId(TestID.NewUserCTAButton).click()
  await page.getByTestId(TestID.CreateAccount).click()

  await page.getByTestId(TestID.WalletNameInput).fill(UNITAG_NAME)
  await page.getByTestId(TestID.Continue).click()
  await page.getByTestId(TestID.Continue).click()

  await page.getByTestId(TestID.CreatePasskey).click()

  await expect(page.getByTestId(TestID.PortfolioBalance)).toBeVisible()
})
