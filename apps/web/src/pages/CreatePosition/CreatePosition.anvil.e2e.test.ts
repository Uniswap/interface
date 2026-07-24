import { listPools } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { computePairAddress } from '@uniswap/v2-sdk'
import { USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { parseEther } from '~/chains'
import { ONE_MILLION_USDT } from '~/playwright/anvil/utils'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { stubLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'
import { assume0xAddress } from '~/utils/wagmi'

const test = getTest({ withAnvil: true })
const WETH_ADDRESS = WETH.address

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
    test('Create position with full range', async ({ page, anvil, graphql, dataApi }) => {
      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.createPosition,
        service: LiquidityService,
      })
      await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
      // Fee-tier auto-selection needs ListPools; the live endpoint rate-limits under
      // suite churn (Cloudflare 429 → the request hangs and step-0 Continue never
      // enables) and reflects the live tip anyway. Serve a recorded response so the
      // flow is deterministic against the pinned fork.
      await dataApi.intercept(listPools, Mocks.DataApiService.list_pools_eth_usdt_v4)
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.goto('/positions/create')
      await page.getByRole('button', { name: 'Choose token' }).click()
      await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
      // oxlint-disable-next-line eslint-js/no-restricted-syntax
      await page.getByTestId('token-option-1-USDT').first().click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await graphql.waitForResponse('PoolPriceHistory')
      await graphql.waitForResponse('AllV4Ticks')
      await page.getByText('Full range').click()
      await reviewAndCreatePosition({ page })
    })

    test('Create position with custom range', async ({ page, anvil, graphql, dataApi }) => {
      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.createPosition,
        service: LiquidityService,
      })
      await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
      // Recorded ListPools: see 'Create position with full range'.
      await dataApi.intercept(listPools, Mocks.DataApiService.list_pools_eth_usdt_v4)
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.goto('/positions/create')
      await page.getByRole('button', { name: 'Choose token' }).click()
      await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
      // oxlint-disable-next-line eslint-js/no-restricted-syntax
      await page.getByTestId('token-option-1-USDT').first().click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await graphql.waitForResponse('PoolPriceHistory')
      await graphql.waitForResponse('AllV4Ticks')
      await page.getByTestId(TestID.RangeInputIncrement + '-0').click()
      await page.getByTestId(TestID.RangeInputDecrement + '-1').click()
      await reviewAndCreatePosition({ page })
    })

    test.describe('v2 zero liquidity', () => {
      test('should create a position', async ({ page, anvil }) => {
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
        await page.goto(`/positions/create/v2?currencyA=${WETH_ADDRESS}&currencyB=${USDT.address}`)
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
          `/positions/create/v2?currencyA=${randomCoin1}&currencyB=${randomCoin2}&chain=ethereum&fee=undefined&hook=undefined&priceRangeState={"priceInverted":false,"fullRange":false,"minPrice":"","maxPrice":"","initialPrice":"","inputMode":"price"}&depositState={"exactField":"TOKEN0","exactAmounts":{}}`,
        )
        await expect(page.getByText('Creating new pool').first()).toBeVisible()
        await page.getByRole('button', { name: 'Continue' }).click()
        await expect(page.url()).toContain('step=1')
      })
    })

    test.describe('approval flow', () => {
      test('should approve tokens and create a V4 position', async ({ page, anvil, graphql, dataApi }) => {
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.createPosition,
          service: LiquidityService,
        })
        await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
        // Recorded ListPools: see 'Create position with full range'.
        await dataApi.intercept(listPools, Mocks.DataApiService.list_pools_eth_usdt_v4)
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })

        await page.goto('/positions/create')
        await page.getByRole('button', { name: 'Choose token' }).click()
        await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
        // oxlint-disable-next-line eslint-js/no-restricted-syntax
        await page.getByTestId('token-option-1-USDT').first().click()
        await page.getByRole('button', { name: 'Continue' }).click()
        await graphql.waitForResponse('PoolPriceHistory')
        await graphql.waitForResponse('AllV4Ticks')
        await page.getByText('Full range').click()

        await page.getByTestId(TestID.AmountInputIn).first().click()
        await page.getByTestId(TestID.AmountInputIn).first().fill('1')

        await page.getByRole('button', { name: 'Review' }).click()
        await page.getByRole('button', { name: 'Create' }).click()
        await expect(page.getByText('Approval pending')).toBeVisible()
        await expect(page.getByText('Sign message')).toBeVisible()
        await expect(page.getByText('Created position')).toBeVisible()
      })

      test('should handle approval when permit2 allowance is already set', async ({
        page,
        anvil,
        graphql,
        dataApi,
      }) => {
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.createPosition,
          service: LiquidityService,
        })
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.checkLPApproval,
          service: LiquidityService,
          modifyResponseData: (data) => {
            return { ...data, transactions: [], v4BatchPermitData: null }
          },
        })
        await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
        // Recorded ListPools: see 'Create position with full range'.
        await dataApi.intercept(listPools, Mocks.DataApiService.list_pools_eth_usdt_v4)
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await anvil.setErc20Allowance({ address: assume0xAddress(USDT.address), spender: PERMIT2_ADDRESS })

        await page.goto('/positions/create')
        await page.getByRole('button', { name: 'Choose token' }).click()
        await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
        // oxlint-disable-next-line eslint-js/no-restricted-syntax
        await page.getByTestId('token-option-1-USDT').first().click()
        await page.getByRole('button', { name: 'Continue' }).click()
        await graphql.waitForResponse('PoolPriceHistory')
        await graphql.waitForResponse('AllV4Ticks')
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
      test('should gracefully handle errors during review', async ({ page, anvil, dataApi }) => {
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.createPosition,
          service: LiquidityService,
          modifyRequestData: (data) => {
            data.simulateTransaction = true
            return data
          },
        })
        // Recorded ListPools: see 'Create position with full range'.
        await dataApi.intercept(listPools, Mocks.DataApiService.list_pools_eth_usdt_v4)
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.goto(`/positions/create?currencyA=NATIVE&currencyB=${USDT.address}`)

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

    test.describe('Custom fee tier', () => {
      test('should create a position with a custom fee tier', async ({ page, anvil }) => {
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.createPosition,
          service: LiquidityService,
        })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.goto(`/positions/create?currencyA=NATIVE&currencyB=${USDT.address}`)
        await page.getByRole('button', { name: 'More', exact: true }).click()
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
        const HOOK_ADDRESS = '0x09DEA99D714A3a19378e3D80D1ad22Ca46085080'
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.createPosition,
          service: LiquidityService,
        })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.goto(`/positions/create?currencyA=NATIVE&currencyB=${USDT.address}&hook=${HOOK_ADDRESS}`)
        await page.getByRole('button', { name: 'More', exact: true }).click()
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
      const ETH_WEETH_CREATE_URL = `/positions/create/v4?currencyA=NATIVE&currencyB=0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee&chain=ethereum&fee={"feeAmount":100,"tickSpacing":1,"isDynamic":false}&hook=undefined&priceRangeState={"priceInverted":false,"fullRange":false,"minTick":-871,"maxTick":-859,"initialPrice":"","inputMode":"price"}&depositState={"exactField":"TOKEN1","exactAmounts":{"TOKEN0":"0.01","TOKEN1":"0.064"}}&step=1&featureFlagOverride=lp_dynamic_native_slippage`

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
        await graphql.intercept('AllV4Ticks', Mocks.AllV4Ticks.eth_weeth)
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
        await graphql.intercept('AllV4Ticks', Mocks.AllV4Ticks.eth_weeth)
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
