import { expect, getTest } from 'playwright/fixtures'
import { setupWebAuthn } from 'playwright/mocks/webAuthn'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

const UNITAG_NAME = 'newunitag'

test.describe(
  'User onboarding',
  {
    tag: '@team:apps-growth',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-growth' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe.configure({ retries: 3 }) // the challenge endpoint can be flaky so retry the whole test

    test.skip('sign up a user', async ({ page }) => {
      await setupWebAuthn(page)

      await page.goto(`https://app.corn-staging.com/?eagerlyConnect=false&featureFlagOverride=embedded_wallet`)

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
  },
)
