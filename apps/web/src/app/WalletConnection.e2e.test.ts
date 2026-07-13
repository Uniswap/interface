import { getPortfolio, listTransactions } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { FeatureFlags, getFeatureFlagName } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

test.describe(
  'Wallet Connection',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('disconnect wallet', async ({ page, dataApi }) => {
      // Mock DataApi so the account drawer doesn't layout-shift mid-hover when the
      // activity/portfolio requests fail (the banner mounting breaks the Tooltip hover).
      await dataApi.intercept(listTransactions, Mocks.DataApiService.list_transactions_empty)
      await dataApi.intercept(getPortfolio, Mocks.DataApiService.get_portfolio_empty)

      await page.goto(`/swap?featureFlagOverrideOff=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`)

      // Verify wallet is connected
      await expect(await page.getByTestId(TestID.Web3StatusConnected).getByText('test0')).toBeVisible()

      // Disconnect the wallet
      await page.getByTestId(TestID.Web3StatusConnected).click()

      await getVisibleDropdownElementByTestId(page, TestID.WalletDisconnect).waitFor({ state: 'visible' })

      // Hover opens the disconnect tooltip; retry as a unit in case drawer content shifts mid-hover.
      await expect(async () => {
        await getVisibleDropdownElementByTestId(page, TestID.WalletDisconnect).hover()
        await expect(page.getByTestId(TestID.WalletDisconnectInModal)).toBeVisible({ timeout: 2_000 })
      }).toPass({ timeout: 4_000 })
      await page.getByTestId(TestID.WalletDisconnectInModal).click()

      // Verify wallet has disconnected
      await expect(page.getByTestId(TestID.NavConnectWalletButton)).toBeVisible()
    })

    test('should connect wallet', async ({ page }) => {
      await page.goto(
        `/swap?eagerlyConnect=false&featureFlagOverrideOff=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`,
      )

      await page.getByText('Connect Wallet').click()
      // Scope to visible dropdown to avoid hidden measurement copy in AdaptiveDropdown
      await page.getByTestId(TestID.AccountDrawer).getByText('Mock Connector').click()

      await expect(await page.getByText('Connect wallet')).not.toBeVisible()
      await expect(await page.getByTestId(TestID.Web3StatusConnected)).toHaveText('test0')
    })
  },
)
