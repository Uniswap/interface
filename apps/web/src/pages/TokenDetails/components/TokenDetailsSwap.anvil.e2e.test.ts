import { TradingApi, V1_TRADING_API_PATHS } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { UNI } from 'uniswap/src/constants/tokens'
import { assume0xAddress, parseEther } from '~/chains'
import { expect, getTest } from '~/playwright/fixtures'
import { stubTradingApiEndpoint, widenSwapRequestSlippage } from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const UNI_MAINNET = UNI[UniverseChainId.Mainnet]

const INPUT_TOKEN_LABEL = `${TestID.ChooseInputToken}-label`
const OUTPUT_TOKEN_LABEL = `${TestID.ChooseOutputToken}-label`

test.describe(
  'TokenDetailsSwap',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should complete a swap of ETH for the page token from the TDP swap component', async ({ page, anvil }) => {
      // The live quoter prices against mainnet tip while anvil forks the pinned block in
      // fork-blocks.json, so widen slippage in the /swap request to tolerate the drift
      await stubTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.swap,
        modifyRequestData: widenSwapRequestSlippage,
      })
      // Route via long-lived V2/V3 pools: v4 pools/routes may postdate the fork pin
      await stubTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.quote,
        // Leave the indicative (FASTEST) quote alone: the API answers it 404
        // "No quotes available" when protocols are forced onto it
        modifyRequestData: (data) =>
          data.routingPreference === TradingApi.RoutingPreference.FASTEST
            ? data
            : {
                ...data,
                protocols: [TradingApi.ProtocolItems.V2, TradingApi.ProtocolItems.V3],
              },
      })

      // On mobile widths, we just link back to /swap instead of rendering the swap component.
      await page.setViewportSize({ width: 1200, height: 800 })
      await page.goto(`/explore/tokens/ethereum/${UNI_MAINNET.address}`)

      await page.getByTestId(INPUT_TOKEN_LABEL).waitFor({ state: 'visible' })
      await page.getByTestId(OUTPUT_TOKEN_LABEL).waitFor({ state: 'visible' })

      await expect(page.getByTestId(INPUT_TOKEN_LABEL)).toContainText('ETH')
      await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toContainText('UNI')

      const ethBalanceBeforeSwap = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
      const uniBalanceBeforeSwap = await anvil.getErc20Balance(assume0xAddress(UNI_MAINNET.address))

      await page.getByTestId(TestID.AmountInputIn).click()
      await page.getByTestId(TestID.AmountInputIn).fill('.1')
      await page.getByTestId(TestID.ReviewSwap).click()
      await page.getByTestId(TestID.Swap).click()

      await page.getByTestId(TestID.ActivityPopup).getByText('Swapped').waitFor({ state: 'visible' })

      // On-chain checks: the "Swapped" toast alone can mask a mined-but-reverted swap
      // (the txPolling fixture rewrites NOT_FOUND to SUCCESS), so require the 0.1 ETH
      // input to have left the wallet and the UNI balance to have grown
      const ethBalanceAfterSwap = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
      await expect(ethBalanceBeforeSwap - ethBalanceAfterSwap).toBeGreaterThanOrEqual(parseEther('.1'))
      const uniBalanceAfterSwap = await anvil.getErc20Balance(assume0xAddress(UNI_MAINNET.address))
      await expect(uniBalanceAfterSwap).toBeGreaterThan(uniBalanceBeforeSwap)
    })
  },
)
