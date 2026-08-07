import { V1_TRADING_API_PATHS } from '@universe/api'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from '~/chains'
import { getUniswapServiceUrls } from '~/config'
import { expect, getTest } from '~/playwright/fixtures'
import { stubTradingApiEndpoint, widenSwapRequestSlippage } from '~/playwright/fixtures/tradingApi'

const test = getTest({ withAnvil: true })

// The swap fee is API-key-side config: the e2e key has no partner fee, so quotes never carry
// `portionBips`. `integratorFees` is the request-side lever — the API applies it and reports it
// as the non-swapper entry in `aggregatedOutputs` (`fee: "INTEGRATOR"`), which is also what the
// app reads to render the fee row and what /swap encodes as the on-chain fee payment.
const TEST_FEE_BIPS = 25
const TEST_FEE_RECIPIENT = '0x7FBa4B8Dc5E7616e59622806932DBea72537A56b'

type AggregatedOutput = { recipient?: string; bps?: number; amount?: string }

function findTestFeeOutput(body?: {
  quote?: { aggregatedOutputs?: AggregatedOutput[] }
}): AggregatedOutput | undefined {
  return body?.quote?.aggregatedOutputs?.find(
    (output) => output.recipient?.toLowerCase() === TEST_FEE_RECIPIENT.toLowerCase(),
  )
}

test.describe(
  'Fees',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('swaps ETH for USDC exact-in with swap fee', async ({ page, anvil }) => {
      // Widen slippage in the /swap request: execution bounds are server-derived from live
      // prices and would revert against the pinned fork state (see widenSwapRequestSlippage)
      await stubTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.swap,
        modifyRequestData: widenSwapRequestSlippage,
      })
      await stubTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.quote,
        modifyRequestData: (data) => ({
          ...data,
          integratorFees: [{ bips: TEST_FEE_BIPS, recipient: TEST_FEE_RECIPIENT }],
        }),
      })

      await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

      // Set up swap
      await page.getByTestId(TestID.AmountInputOut).fill('1')

      // Multiple /quote requests race (primary + indicative FASTEST); wait for one that
      // actually carries the injected fee output instead of whichever lands first
      const response = await page.waitForResponse(async (res) => {
        if (res.url() !== `${getUniswapServiceUrls().tradingApiUrl}/quote` || !res.ok()) {
          return false
        }
        const body = await res.json().catch(() => undefined)
        return findTestFeeOutput(body) !== undefined
      })
      const feeOutput = findTestFeeOutput(await response.json())
      const feeBips = feeOutput?.bps ?? TEST_FEE_BIPS

      const feeRecipientBalance = await anvil.getErc20Balance(assume0xAddress(USDC_MAINNET.address), TEST_FEE_RECIPIENT)

      // Initiate transaction
      await page.getByTestId(TestID.ReviewSwap).click()

      // Verify fee percentage and amount is displayed
      await page.getByText(`Fee (${feeBips / 100}%)`)
      await page.getByTestId(TestID.Swap).click()

      // UI wait for tx to complete
      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Swapped')).toBeVisible()

      // Verify fee recipient received fee on-chain — a mined-but-reverted swap (masked as
      // "Swapped" by the txPolling fixture's status rewrite) leaves this balance unchanged
      const finalRecipientBalance = await anvil.getErc20Balance(
        assume0xAddress(USDC_MAINNET.address),
        TEST_FEE_RECIPIENT,
      )
      await expect(finalRecipientBalance).toBeGreaterThan(feeRecipientBalance)
    })
  },
)
