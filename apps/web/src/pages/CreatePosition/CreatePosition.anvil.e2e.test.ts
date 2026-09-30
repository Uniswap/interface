import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { CHAIN_TO_ADDRESSES_MAP, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { computePairAddress } from '@uniswap/v2-sdk'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { USDT } from 'uniswap/src/constants/tokens'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { parseEther } from '~/chains'
import { assume0xAddress } from '~/chains'
import { ONE_MILLION_USDT } from '~/playwright/anvil/utils'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { stubLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest({ withAnvil: true })
const WETH_ADDRESS = WETH.address

// The create mint executes on the pinned fork, but the liquidity service prices the calldata (and
// its slippage bounds) against LIVE mainnet. The ETH price gap between the two grows as the pin
// ages and trips the v4 mint's MaximumAmountExceeded guard. Force a generous — but sub-critical
// (see SLIPPAGE_CRITICAL_TOLERANCE = 20, which would open a blocking warning) — slippage so the
// fork-vs-live drift can't fail the create. Real users never see this test-only gap.
const E2E_CREATE_SLIPPAGE_TOLERANCE = 15

async function stubCreatePosition(page: Page): Promise<void> {
  await stubLiquidityServiceEndpoint({
    page,
    endpoint: LiquidityService.methods.createPosition,
    service: LiquidityService,
    modifyRequestData: (data) => ({ ...data, slippageTolerance: E2E_CREATE_SLIPPAGE_TOLERANCE }),
  })
}

// Picks ETH/USDT and its 0.3% tier the way a user does. The form pre-selects no tier, and choosing
// a token clears whatever tier is set (a tier only means something for the pair it was picked on),
// so the tier has to be clicked after the pair — a `fee` seeded in the URL would be wiped here.
// Each grid box is a button labeled fee-first ("0.3% Commonly used for most pairs. $27.1M TVL
// 78.124% select"), so anchoring the name keeps the live TVL and selection share out of the match.
async function selectEthUsdtWithDefaultFeeTier({ page }: { page: Page }): Promise<void> {
  await page.getByRole('button', { name: 'Choose token' }).click()
  await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
  // oxlint-disable-next-line eslint-js/no-restricted-syntax
  await page.getByTestId('token-option-1-USDT').first().click()
  await page.getByRole('button', { name: /^0\.3%/ }).click()
}

test.describe(
  'Create position',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('Create position with full range', async ({ page, anvil, graphql }) => {
      await stubCreatePosition(page)
      await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.goto('/positions/add/new')
      await selectEthUsdtWithDefaultFeeTier({ page })
      await page.getByRole('button', { name: 'Continue' }).click()
      await graphql.waitForResponse('PoolPriceHistory')
      await page.getByText('Full range').click()
      await reviewAndCreatePosition({ page })
    })

    test('Create position with custom range', async ({ page, anvil, graphql }) => {
      await stubCreatePosition(page)
      await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.goto('/positions/add/new')
      await selectEthUsdtWithDefaultFeeTier({ page })
      await page.getByRole('button', { name: 'Continue' }).click()
      await graphql.waitForResponse('PoolPriceHistory')
      await page.getByTestId(TestID.RangeInputIncrement + '-0').click()
      await page.getByTestId(TestID.RangeInputDecrement + '-1').click()
      await reviewAndCreatePosition({ page })
    })

    test.describe('v2 zero liquidity', () => {
      test('should create a position', async ({ page, anvil }) => {
        // The app requests simulateTransaction=true (approval simulation is default-enabled for
        // mainnet), but the live service gas-estimates against LIVE mainnet where the test wallet
        // holds nothing, so CreateClassicPosition 404s (FAILED_TO_ESTIMATE_GAS:
        // TransferHelper: TRANSFER_FROM_FAILED) and Review never enables. Route through the stub,
        // which forces simulateTransaction=false; the transaction still executes on the fork.
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.createClassicPosition,
          service: LiquidityService,
        })
        await anvil.setErc20Balance({ address: assume0xAddress(WETH_ADDRESS), balance: parseEther('100') })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await anvil.setV2PoolReserves({
          pairAddress: assume0xAddress(
            computePairAddress({
              factoryAddress: V2_FACTORY_ADDRESSES[UniverseChainId.Mainnet],
              tokenA: WETH,
              tokenB: USDT,
            }),
          ),
          reserve0: 0n,
          reserve1: 0n,
        })
        await page.goto(`/positions/add/new?currencyA=${WETH_ADDRESS}&currencyB=${USDT.address}&protocolVersion=v2`)
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.getByTestId(TestID.AmountInputIn).last().click()
        await page.getByTestId(TestID.AmountInputIn).last().fill('10000')
        await page.getByTestId(TestID.AmountInputIn).first().click()
        await page.getByTestId(TestID.AmountInputIn).first().fill('1')
        await page.getByRole('button', { name: 'Review' }).click()
        await page.getByRole('button', { name: 'Create' }).click()
        await expect(page.getByText('Creating position')).toBeVisible()
      })
    })

    test.describe('v2 no pair', () => {
      test('should create a pair', async ({ page, anvil }) => {
        // random coins that are unlikely to have a v2 pair
        const randomCoin1 = '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c'
        const randomCoin2 = '0x3081f70000e8CF8Be2aFCaE3Db6B9D9c796CaEc5'

        await anvil.setErc20Balance({ address: assume0xAddress(WETH_ADDRESS), balance: parseEther('100') })
        await page.goto(
          `/positions/add/new?currencyA=${randomCoin1}&currencyB=${randomCoin2}&protocolVersion=v2&chain=ethereum&fee=undefined&hook=undefined&priceRangeState={"priceInverted":false,"fullRange":false,"minPrice":"","maxPrice":"","initialPrice":"","inputMode":"price"}&depositState={"exactField":"TOKEN0","exactAmounts":{}}`,
        )
        await expect(page.getByText('Creating new pool').first()).toBeVisible()
        await page.getByRole('button', { name: 'Continue' }).click()
        await expect(page.url()).toContain('step=1')
      })
    })

    test.describe('approval flow', () => {
      test('should approve tokens and create a V4 position', async ({ page, anvil, graphql }) => {
        await stubCreatePosition(page)
        await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })

        await page.goto('/positions/add/new')
        await selectEthUsdtWithDefaultFeeTier({ page })
        await page.getByRole('button', { name: 'Continue' }).click()
        await graphql.waitForResponse('PoolPriceHistory')
        await page.getByText('Full range').click()

        await page.getByTestId(TestID.AmountInputIn).first().click()
        await page.getByTestId(TestID.AmountInputIn).first().fill('1')

        await page.getByRole('button', { name: 'Review' }).click()
        await page.getByRole('button', { name: 'Create' }).click()
        await expect(page.getByText('Approval pending')).toBeVisible()
        await expect(page.getByText('Sign message')).toBeVisible()
        await expect(page.getByText('Created position')).toBeVisible()
      })

      test('should handle approval when permit2 allowance is already set', async ({ page, anvil, graphql }) => {
        await stubCreatePosition(page)
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.checkLPApproval,
          service: LiquidityService,
          modifyResponseData: (data) => {
            return { ...data, transactions: [], v4BatchPermitData: null }
          },
        })
        await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await anvil.setErc20Allowance({ address: assume0xAddress(USDT.address), spender: PERMIT2_ADDRESS })
        // checkLPApproval is stubbed to report no permit needed (v4BatchPermitData: null), so the
        // Permit2 -> PositionManager allowance the mint pulls USDT through must already be set on
        // chain — otherwise the mint reverts AllowanceExpired. The ERC20 approve above only lets
        // Permit2 move USDT; this is the Permit2 allowance the position manager actually spends.
        await anvil.setPermit2Allowance({
          token: assume0xAddress(USDT.address),
          spender: assume0xAddress(CHAIN_TO_ADDRESSES_MAP[UniverseChainId.Mainnet].v4PositionManagerAddress!),
        })

        await page.goto('/positions/add/new')
        await selectEthUsdtWithDefaultFeeTier({ page })
        await page.getByRole('button', { name: 'Continue' }).click()
        await graphql.waitForResponse('PoolPriceHistory')
        await page.getByText('Full range').click()

        await page.getByTestId(TestID.AmountInputIn).first().click()
        await page.getByTestId(TestID.AmountInputIn).first().fill('1')

        await page.getByRole('button', { name: 'Review' }).click()
        await page.getByRole('button', { name: 'Create' }).click()
        await expect(page.getByText('Approval required')).not.toBeVisible()
        await expect(page.getByText('Signature required')).not.toBeVisible()
        await expect(page.getByText('Created position')).toBeVisible()
      })
    })

    test.describe('error handling', () => {
      test('should gracefully handle errors during review', async ({ page, anvil }) => {
        await stubCreatePosition(page)
        // This test used to force simulateTransaction: true and rely on the LIVE
        // simulation failing; the live service now returns valid calldata, so the error
        // state never appeared. Fail the 1-ETH request deterministically instead; every
        // other request (pre-estimate dust amounts, the 2-ETH re-quote) falls back to the
        // sim-disabled stub above.
        await page.route('**/uniswap.liquidity.v2.LiquidityService/CreatePosition*', async (route) => {
          const requestData = JSON.parse(route.request().postData() ?? '{}')
          if (requestData.independentToken?.amount === parseEther('1').toString()) {
            await route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({ code: 'internal', message: 'simulated create failure from e2e fixture' }),
            })
            return
          }
          await route.fallback()
        })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        // Seed the fee tier in the URL so the pair is valid and Continue enables. SelectTokenStep no
        // longer pre-selects a tier, and the add flow's own default only runs on /positions/add/*
        // routes, so a URL-seeded pair otherwise reaches this step with no tier and a permanently
        // disabled Continue. 0.3% is the recommended ETH/USDT tier.
        await page.goto(
          `/positions/add/new?currencyA=NATIVE&currencyB=${USDT.address}&fee={"feeAmount":3000,"tickSpacing":60,"isDynamic":false}`,
        )

        await page.getByRole('button', { name: 'Continue' }).click()

        await page.getByTestId(TestID.AmountInputIn).first().click()
        await page.getByTestId(TestID.AmountInputIn).first().fill('1')

        await expect(page.getByText('Something went wrong')).toBeVisible()
        await expect(page.getByText('Request failed')).toBeVisible()

        await page.getByTestId(TestID.AmountInputIn).first().click()
        await page.getByTestId(TestID.AmountInputIn).first().fill('2')

        await expect(page.getByText('Something went wrong')).not.toBeVisible()
        await expect(page.getByText('Request failed')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Review' })).toBeVisible()
      })
    })

    // No expand step before the search link: the tier grid now opens expanded (its toggle reads
    // "Less"), so "Search or create other fee tiers" is on screen as soon as the pair resolves.
    test.describe('Custom fee tier', () => {
      test('should create a position with a custom fee tier', async ({ page, anvil }) => {
        await stubCreatePosition(page)
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.goto(`/positions/add/new?currencyA=NATIVE&currencyB=${USDT.address}`)
        await page.getByText('Search or create other fee').click()
        await page.getByRole('button', { name: 'Create new fee tier' }).click()
        await page.getByPlaceholder('0').fill('3.1415')
        await page.getByRole('button', { name: 'Create new fee tier' }).click()
        await expect(page.getByText('New tier').first()).toBeVisible()
        await expect(page.getByText('Creating new pool')).toBeVisible()
        await page.getByRole('button', { name: 'Continue' }).click()
        await reviewAndCreatePosition({ page })
      })

      test('should create a position with a dynamic fee tier', async ({ page, anvil }) => {
        // Address encodes v4 hook flags AFTER_INITIALIZE (0x1000) + BEFORE_SWAP (0x80); nothing is
        // deployed there on mainnet, so pool initialization reverts InvalidHookResponse. Etch a
        // minimal hook that returns the afterInitialize selector (the only hook call the create
        // makes — the mint never swaps) so the pool initializes on the fork.
        const HOOK_ADDRESS = '0x09DEA99D714A3a19378e3D80D1ad22Ca46085080'
        await anvil.setCode({ address: HOOK_ADDRESS, bytecode: '0x636fe7e6eb60e01b60005260206000f3' })
        await stubCreatePosition(page)
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.goto(`/positions/add/new?currencyA=NATIVE&currencyB=${USDT.address}&hook=${HOOK_ADDRESS}`)
        await page.getByText('Search or create other fee').click()
        await page.getByText('Dynamic fee').click()
        await page.getByTestId(TestID.DynamicFeeTierSpeedbumpContinue).click()
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.getByTestId(TestID.HookModalContinueButton).click()
        await reviewAndCreatePosition({ page })
      })
    })

    test.describe('Dynamic slippage', () => {
      const WEETH_ADDRESS = '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee'
      const ETH_WEETH_CREATE_URL = `/positions/add/new?currencyA=NATIVE&currencyB=0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee&protocolVersion=v4&chain=ethereum&fee={"feeAmount":100,"tickSpacing":1,"isDynamic":false}&hook=undefined&priceRangeState={"priceInverted":false,"fullRange":false,"minTick":-871,"maxTick":-859,"initialPrice":"","inputMode":"price"}&depositState={"exactField":"TOKEN1","exactAmounts":{"TOKEN0":"0.01","TOKEN1":"0.064"}}&step=1&featureFlagOverride=lp_dynamic_native_slippage`

      // The live CreatePosition endpoint computes slippage from the test wallet's
      // LIVE mainnet balances server-side and 500s ("Insufficient balance for
      // slippage calculation") for any deposit above them, so forked funding can
      // never satisfy it. Serve a recorded success response instead: this test only
      // asserts the slippage-warning UI driven by the response's `slippage` field
      // and never submits the returned calldata on chain.
      test('shows low slippage warning for ETH/WEETH pool', async ({ page, anvil, graphql }) => {
        await page.route('**/uniswap.liquidity.v2.LiquidityService/CreatePosition*', async (route) => {
          await route.fulfill({ path: Mocks.LiquidityService.create_position_eth_weeth_low_slippage })
        })
        await page.route('**/uniswap.liquidity.v1.LiquidityService/PoolInfo*', async (route) => {
          await route.fulfill({ path: Mocks.LiquidityService.pool_info_eth_weeth })
        })
        await graphql.intercept('PoolPriceHistory', Mocks.PoolPriceHistory.eth_weeth)
        await anvil.setBalance({ address: assume0xAddress(TEST_WALLET_ADDRESS), value: parseEther('10') })
        await anvil.setErc20Balance({ address: assume0xAddress(WEETH_ADDRESS), balance: parseEther('100') })

        await page.goto(ETH_WEETH_CREATE_URL)

        await page.getByTestId(TestID.AmountInputIn).last().click()
        await page.getByTestId(TestID.AmountInputIn).last().fill('3')
        await expect(page.getByText('Slippage automatically reduced')).toBeVisible()
      })

      // Recorded CreatePosition response: see 'shows low slippage warning' above.
      // The extreme `slippage` value in the fixture drives the warning modal; the
      // flow is cancelled at review so the fixture calldata is never executed.
      test('shows very high slippage warning when backend returns extreme value', async ({ page, anvil, graphql }) => {
        await page.route('**/uniswap.liquidity.v2.LiquidityService/CreatePosition*', async (route) => {
          await route.fulfill({ path: Mocks.LiquidityService.create_position_eth_weeth_high_slippage })
        })
        await page.route('**/uniswap.liquidity.v1.LiquidityService/PoolInfo*', async (route) => {
          await route.fulfill({ path: Mocks.LiquidityService.pool_info_eth_weeth })
        })
        await graphql.intercept('PoolPriceHistory', Mocks.PoolPriceHistory.eth_weeth)
        await anvil.setBalance({ address: assume0xAddress(TEST_WALLET_ADDRESS), value: parseEther('10000') })
        await anvil.setErc20Balance({ address: assume0xAddress(WEETH_ADDRESS), balance: parseEther('10') })

        await page.goto(ETH_WEETH_CREATE_URL)

        await page.getByTestId(TestID.AmountInputIn).last().click()
        await page.getByTestId(TestID.AmountInputIn).last().fill('5')
        await page.getByRole('button', { name: 'Review' }).click()
        await expect(page.getByText('Very high slippage')).toBeVisible()
        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.getByText('Very high slippage')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Review' })).toBeVisible()
      })
    })
  },
)

async function reviewAndCreatePosition({ page }: { page: Page }) {
  await page.getByTestId(TestID.AmountInputIn).first().click()
  await page.getByTestId(TestID.AmountInputIn).first().fill('1')
  await page.getByRole('button', { name: 'Review' }).click()
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByText('Created position')).toBeVisible()
  await expect(page).toHaveURL('/positions')
}
