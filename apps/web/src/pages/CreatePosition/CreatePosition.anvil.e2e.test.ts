import { V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { computePairAddress } from '@uniswap/v2-sdk'
import { ONE_MILLION_USDT } from 'playwright/anvil/utils'
import { expect, getTest, type Page } from 'playwright/fixtures'
import { DEFAULT_TEST_GAS_LIMIT, stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { Mocks } from 'playwright/mocks/mocks'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'
import { parseEther } from 'viem'

const test = getTest({ withAnvil: true })

const WETH_ADDRESS = WETH.address
const DEFAULT_INITIAL_POOL_PRICE = '3000'

function modifyGasLimit(data: { create: { gasLimit: string } }) {
  try {
    data.create.gasLimit = DEFAULT_TEST_GAS_LIMIT
    return data
  } catch {
    return data
  }
}

test.describe('Create position', () => {
  test('Create position with full range', async ({ page, anvil, graphql }) => {
    await stubTradingApiEndpoint({
      page,
      endpoint: uniswapUrls.tradingApiPaths.createLp,
      modifyResponseData: modifyGasLimit,
    })
    await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
    await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
    await page.goto('/positions/create')
    await page.getByRole('button', { name: 'Choose token' }).click()
    await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
    // eslint-disable-next-line
    await page.getByTestId('token-option-1-USDT').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await reviewAndCreatePosition({ page })
  })

  test('Create position with custom range', async ({ page, anvil, graphql }) => {
    await stubTradingApiEndpoint({
      page,
      endpoint: uniswapUrls.tradingApiPaths.createLp,
      modifyResponseData: modifyGasLimit,
    })
    await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
    await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
    await page.goto('/positions/create')
    await page.getByRole('button', { name: 'Choose token' }).click()
    await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
    // eslint-disable-next-line
    await page.getByTestId('token-option-1-USDT').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await graphql.waitForResponse('PoolPriceHistory')
    await graphql.waitForResponse('AllV4Ticks')
    await page.getByText('Custom range').click()
    await page.getByTestId(TestID.RangeInputIncrement + '-0').click()
    await page.getByTestId(TestID.RangeInputDecrement + '-1').click()
    await reviewAndCreatePosition({ page })
  })

  test.describe('error handling', () => {
    test('should gracefully handle errors during review', async ({ page, anvil }) => {
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.goto(`/positions/create?currencyA=NATIVE&currencyB=${USDT.address}`)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByTestId(TestID.AmountInputIn).first().click()
      await page.getByTestId(TestID.AmountInputIn).first().fill('1')
      await page.getByRole('button', { name: 'Review' }).click()
      await page.getByRole('button', { name: 'Create' }).click()
      await expect(page.getByText('Something went wrong').first()).toBeVisible()
      await page.getByRole('button', { name: 'Create' }).click()
      await expect(page.getByText('Something went wrong').first()).not.toBeVisible()
    })
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

  test.describe('Custom fee tier', () => {
    test('should create a position with a custom fee tier', async ({ page, anvil }) => {
      await stubTradingApiEndpoint({
        page,
        endpoint: uniswapUrls.tradingApiPaths.createLp,
        modifyResponseData: modifyGasLimit,
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
      // Set initial price for new pool
      await page.getByPlaceholder('0').first().fill(DEFAULT_INITIAL_POOL_PRICE)
      await reviewAndCreatePosition({ page })
    })

    test('should create a position with a custom fee tier and a dynamic fee tier', async ({ page, anvil }) => {
      const HOOK_ADDRESS = '0x09DEA99D714A3a19378e3D80D1ad22Ca46085080'
      await stubTradingApiEndpoint({
        page,
        endpoint: uniswapUrls.tradingApiPaths.createLp,
        modifyResponseData: modifyGasLimit,
      })
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.goto(`/positions/create?currencyA=NATIVE&currencyB=${USDT.address}&hook=${HOOK_ADDRESS}`)
      await page.getByRole('button', { name: 'More', exact: true }).click()
      await page.getByText('Search or create other fee').click()
      await page.getByText('Dynamic fee').click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      // Set initial price for new pool
      await page.getByPlaceholder('0').first().fill(DEFAULT_INITIAL_POOL_PRICE)
      await reviewAndCreatePosition({ page })
    })
  })
})

async function reviewAndCreatePosition({ page }: { page: Page }) {
  await page.getByTestId(TestID.AmountInputIn).first().click()
  await page.getByTestId(TestID.AmountInputIn).first().fill('1')
  await page.getByRole('button', { name: 'Review' }).click()
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByText('Created position')).toBeVisible()
  await expect(page).toHaveURL('/positions')
}
