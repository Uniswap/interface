import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { V1_TRADING_API_PATHS } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { parseEther } from '~/chains'
import { expect, getTest } from '~/playwright/fixtures'
import { stubTradingApiEndpoint } from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { assume0xAddress } from '~/utils/wagmi'

const test = getTest({ withAnvil: true })

// Placing a limit order with native ETH input wraps ETH -> WETH
// as the first confirm step (UniswapX limits trade WETH, not native
// ETH) This test asserts the deposit minted WETH on-chain.
test.describe(
  'Limit order WETH wrap',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe.configure({ retries: 3 })

    test('wraps ETH to WETH as the first step of a limit order', async ({ page, anvil }) => {
      const wethAddress = assume0xAddress(WETH_ADDRESS(UniverseChainId.Mainnet))

      // `wrapInfo.needsWrap` is only true (which we need) when `usdCostPerGas`
      // can be derived from the quote's gas fields so we make it the case.
      await stubTradingApiEndpoint({ page, endpoint: V1_TRADING_API_PATHS.quote })
      // Native ETH to wrap, plus headroom for gas, ETH -> WETH path
      await anvil.setBalance({ address: TEST_WALLET_ADDRESS, value: parseEther('10') })

      await page.goto('/limit')

      // The limit page defaults to ETH (input) -> ANY okay
      await page.getByTestId(TestID.AmountInputIn).fill('0.01')
      // A limit price must be set for a trade to exist (and thus for
      // `submit-order-button` to render). The preset buttons are text-only.
      await page.getByText('+1%').click()

      const wethBefore = await anvil.getErc20Balance(wethAddress, TEST_WALLET_ADDRESS)
      await page.getByTestId(TestID.SubmitOrderButton).click()

      // needsWrap only resolves true AFTER the /quote for the typed amount returns
      // (usdCostPerGas, useLimitOrderTrade -> getWrapInfo) plus a WETH-deposit gas
      // estimate against the fork — a full roundtrip that races this test's fast
      // confirm click (the market-price quote alone enables the button). Until it
      // resolves, the trade carries needsWrap:false and confirming would sign the
      // order immediately, skipping the wrap step. The review modal's Network cost
      // is wrap-gas-only for limit trades ("$0" until needsWrap flips true), so wait
      // for the real estimate before confirming.
      // The row's text is the label directly followed by the fiat value ("Network cost$0",
      // then "Network cost<$0.01" once the estimate lands) — anchoring on the value keeps
      // this from matching the bare label or the tooltip copy ("Network cost is paid...").
      // The char class must cover BOTH states or the row stops matching after the flip.
      const networkCostRow = page.getByText(/^Network cost[<$]/)
      // Guard first: a negative assertion alone could pass before the modal renders.
      await expect(networkCostRow).toBeVisible()
      // 30s: the flip can wait on the app's next quote poll (~12.5s cycle) plus an
      // estimateGas roundtrip, which can exceed the 15s default expect timeout.
      await expect(networkCostRow).not.toHaveText(/^Network cost\$0$/, { timeout: 30_000 })

      // The wrap deposit is sent fee-less. Pin an ample base fee so the filled
      // maxFeePerGas clears the (~1 gwei) tip and the deposit is accepted.
      const FORK_BASE_FEE = 100_000_000_000n // 100 gwei
      await anvil.setNextBlockBaseFeePerGas({ baseFeePerGas: FORK_BASE_FEE })

      await page.getByTestId(TestID.ConfirmSwapButton).click()

      // Anvil auto-mines each tx, so the deposit is included as soon
      // as it's submitted. Poll only to await the async submission.
      await expect
        .poll(() => anvil.getErc20Balance(wethAddress, TEST_WALLET_ADDRESS), { timeout: 30_000 })
        .toBeGreaterThan(wethBefore)
    })
  },
)
