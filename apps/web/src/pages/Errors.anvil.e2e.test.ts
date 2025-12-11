import { rejectNextTransaction } from 'components/Web3Provider/rejectableConnector'
import { expect, getTest } from 'playwright/fixtures'
import { HAYDEN_ADDRESS, TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest({ withAnvil: true })

test.describe(
  'Errors',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('wallet rejection', async ({ page, anvil }) => {
      await page.goto('/send')

      const nonceBefore = await anvil.getTransactionCount({ address: TEST_WALLET_ADDRESS })

      // Fill in amount to send
      await page.getByTestId(TestID.SendFormAmountInput).click()
      await page.getByTestId(TestID.SendFormAmountInput).fill('10')

      // Fill in recipient address
      const recipientInput = page.getByPlaceholder(/address or ens/i)
      await recipientInput.click()
      await recipientInput.fill(HAYDEN_ADDRESS)
      await page.getByText('hayden.eth').click()

      // Wait for send button to be enabled
      const sendButton = page.getByRole('button', { name: /^send$/i })
      await expect(sendButton).toBeEnabled()
      await sendButton.click()

      // Click Continue on the new address confirmation modal
      await page.getByRole('button', { name: /continue/i }).click()

      // Wait for review modal to appear
      await expect(page.getByTestId(TestID.SendReviewModal)).toBeVisible()

      // Set rejection flag before confirming send
      await rejectNextTransaction(page)

      // Confirm send (this should be rejected)
      await page.getByRole('button', { name: /confirm send/i }).click()

      await anvil.mine({ blocks: 1 })
      const nonceAfter = await anvil.getTransactionCount({ address: TEST_WALLET_ADDRESS })

      // Verify transaction was rejected - nonce should not have changed
      expect(nonceAfter).toBe(nonceBefore)
    })
  },
)
