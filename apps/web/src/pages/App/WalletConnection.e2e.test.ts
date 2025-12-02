import { FeatureFlags, getFeatureFlagName } from '@universe/gating'
import ms from 'ms'
import { expect, getTest } from 'playwright/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe(
  'Wallet Connection',
  {
    tag: '@team:apps-growth',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-growth' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('disconnect wallet', async ({ page }) => {
      await page.goto(`/swap?featureFlagOverrideOff=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`)
      await page.getByTestId(TestID.AmountInputIn).fill('1')

      // Verify wallet is connected
      await expect(await page.getByTestId(TestID.Web3StatusConnected).getByText('test0')).toBeVisible()

      // Disconnect the wallet
      await page.getByTestId(TestID.Web3StatusConnected).click()

      // Wait for the disconnect button to be visible
      await page.getByTestId(TestID.WalletDisconnect).waitFor({ state: 'visible' })
      await page.getByTestId(TestID.WalletDisconnect).hover()
      await page.getByTestId(TestID.WalletDisconnectInModal).click()

      // Check if tooltip content appears (Solana enabled case)
      const hasTooltip = await page.getByTestId(TestID.WalletDisconnectInModal).isVisible({ timeout: ms('3s') })

      if (hasTooltip) {
        await page.getByTestId(TestID.WalletDisconnectInModal).click()
      }

      // Verify wallet has disconnected
      await expect(await page.getByText('Connect wallet')).toBeVisible()

      // Verify swap input is not cleared
      await expect(await page.getByTestId(TestID.AmountInputIn)).toHaveValue('1')
    })

    test('should connect wallet', async ({ page }) => {
      await page.goto(
        `/swap?eagerlyConnect=false&featureFlagOverrideOff=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`,
      )

      await page.getByText('Connect Wallet').click()
      await page.getByText('Mock Connector').click()

      await expect(await page.getByText('Connect wallet')).not.toBeVisible()
      await expect(await page.getByTestId(TestID.Web3StatusConnected)).toHaveText('test0')
    })
  },
)
