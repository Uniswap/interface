import { expect, test } from 'playwright/fixtures'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/anvil'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

test.describe('Wallet Connection', () => {
  test('disconnect wallet', async ({ page }) => {
    await page.goto(`/swap?featureFlagOverrideOff=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`)
    await page.getByTestId(TestID.AmountInputIn).fill('1')

    // Verify wallet is connected
    await expect(await page.getByText(await TEST_WALLET_ADDRESS.substring(0, 6)).first()).toBeVisible()
    await expect(await page.getByText('10,000.00 ETH')).toBeVisible()

    // Disconnect the wallet
    await page.getByTestId(TestID.Web3StatusConnected).click()
    await page.getByTestId(TestID.WalletDisconnect).click()
    await expect(await page.getByTestId(TestID.WalletDisconnect)).toContainText('Disconnect') // Confirmation UI
    await page.getByTestId(TestID.WalletDisconnect).click() // Confirm

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
    await page.getByText('Other wallets').click()
    await page.getByText('Mock Connector').click()

    await expect(await page.getByText('Connect wallet')).not.toBeVisible()
    await expect(await page.getByTestId(TestID.Web3StatusConnected)).toHaveText('test0')
  })
})
