import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { stubTradingApiEndpoint } from '~/playwright/fixtures/tradingApi'
import { HAYDEN_ADDRESS, TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const SEND_AMOUNT_ETH = '10' // $10 worth

test.describe(
  'Send',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should send ETH to recipient', async ({ page, anvil }) => {
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
      await page.goto('/send')

      // Get initial balances
      const initialSenderBalance = await anvil.getBalance({
        address: TEST_WALLET_ADDRESS,
      })
      const initialRecipientBalance = await anvil.getBalance({
        address: HAYDEN_ADDRESS,
      })

      // Fill in amount to send
      await page.getByTestId(TestID.SendFormAmountInput).click()
      await page.getByTestId(TestID.SendFormAmountInput).fill(SEND_AMOUNT_ETH)

      // Fill in recipient address
      const recipientInput = page.getByPlaceholder(/address or ens/i)
      await recipientInput.click()
      await recipientInput.fill(HAYDEN_ADDRESS)
      await page.getByText('hayden.eth').click()

      const sendButton = page.getByRole('button', { name: /^send$/i })
      // Wait for send button to be enabled (indicates recipient is validated)
      await expect(sendButton).toBeEnabled()
      await sendButton.click()

      // Click Continue on the new address confirmation modal
      await page.getByRole('button', { name: /continue/i }).click()

      // Wait for review modal to appear
      await expect(page.getByTestId(TestID.SendReviewModal)).toBeVisible()

      // Confirm send
      await page.getByRole('button', { name: /confirm send/i }).click()

      // Wait for the modal to close (indicates transaction was submitted)
      await expect(page.getByTestId(TestID.SendReviewModal)).not.toBeVisible()

      // Mine a block to confirm the transaction
      await anvil.mine({ blocks: 1 })

      // Verify sender balance decreased
      const finalSenderBalance = await anvil.getBalance({
        address: TEST_WALLET_ADDRESS,
      })
      await expect(finalSenderBalance).toBeLessThan(initialSenderBalance)

      // Verify recipient balance increased
      const finalRecipientBalance = await anvil.getBalance({
        address: HAYDEN_ADDRESS,
      })
      await expect(finalRecipientBalance).toBeGreaterThan(initialRecipientBalance)
    })
  },
)
