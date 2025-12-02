import { rejectNextTransaction } from 'components/Web3Provider/rejectableConnector'
import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { type HexString } from 'utilities/src/addresses/hex'

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
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })

      await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

      const nonceBefore = await anvil.getTransactionCount({ address: TEST_WALLET_ADDRESS })

      // Enter amount to swap
      await page.getByTestId(TestID.AmountInputOut).fill('1')

      // Wait for input value to be populated
      await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue(/.+/)

      // Submit transaction
      await page.getByTestId(TestID.ReviewSwap).click()

      // Set rejection flag before clicking Swap
      await rejectNextTransaction(page)

      await page.getByTestId(TestID.Swap).click()

      await anvil.mine({ blocks: 1 })
      const nonceAfter = await anvil.getTransactionCount({ address: TEST_WALLET_ADDRESS })

      // Verify transaction was rejected - nonce should not have changed
      expect(nonceAfter).toBe(nonceBefore)
    })

    test.skip('transaction past deadline', async ({ page, anvil }) => {
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
      await stubTradingApiEndpoint({
        page,
        endpoint: uniswapUrls.tradingApiPaths.quote,
        modifyRequestData: (data) => ({
          ...data,
          protocols: ['V2', 'V3'],
        }),
      })

      await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

      // Enter amount to swap
      await page.getByTestId(TestID.AmountInputOut).fill('1')

      // Wait for input value to be populated
      await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue(/.+/)

      // Submit transaction
      await page.getByTestId(TestID.ReviewSwap).click()
      await page.getByTestId(TestID.Swap).click()

      // Get the hash of the transaction in the mempool
      let hash: HexString | undefined
      const startTime = performance.now()
      const timeoutMs = 5000
      while (!hash) {
        if (performance.now() - startTime > timeoutMs) {
          throw new Error('Timeout: Transaction hash not found within 5 seconds')
        }

        const poolContent = await anvil.getTxpoolContent()
        const currentTransaction = Object.entries(
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          poolContent.pending[normalizeAddress(TEST_WALLET_ADDRESS, AddressStringFormat.Lowercase) as HexString] ?? {},
        )[0]

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        hash = currentTransaction[1]?.hash
      }

      await anvil.dropTransaction({
        hash: hash as HexString,
      })
      await anvil.mine({
        blocks: 1,
      })

      // Verify failure state by checking the button text
      await expect(page.getByText('Swap failed')).toBeVisible()
    })
  },
)
