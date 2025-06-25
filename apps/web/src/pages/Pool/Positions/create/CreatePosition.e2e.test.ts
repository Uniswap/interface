import ms from 'ms'
import { ONE_MILLION_USDT } from 'playwright/anvil/utils'
import { Page, expect, test } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { Mocks } from 'playwright/mocks/mocks'
import { DAI, USDT, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'

const WETH_ADDRESS = WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet]!.address

test.describe('Create position', () => {
  test('Create position with full range', async ({ page, anvil, graphql }) => {
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.createLp })
    await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
    await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
    await page.goto('/positions/create')
    await page.getByRole('button', { name: 'Choose token' }).click()
    await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
    // eslint-disable-next-line
    await page.getByTestId('token-option-1-USDT').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByTestId(TestID.AmountInputIn).first().click()
    await page.getByTestId(TestID.AmountInputIn).first().fill('1')
    await page.getByRole('button', { name: 'Review' }).click()
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByText('Created position')).toBeVisible()
    await expect(page).toHaveURL('/positions')
  })

  test('Create position with custom range', async ({ page, anvil, graphql }) => {
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.createLp })
    await graphql.intercept('SearchTokens', Mocks.Token.search_token_tether)
    await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
    await page.goto('/positions/create')
    await page.getByRole('button', { name: 'Choose token' }).click()
    await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
    // eslint-disable-next-line
    await page.getByTestId('token-option-1-USDT').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByText('Custom range').click()
    await page.getByTestId(TestID.AmountInputIn).first().click()
    await page.getByTestId(TestID.AmountInputIn).first().fill('1')
    await page.getByTestId(TestID.RangeInputDecrement + '-0').click()
    await page.getByTestId(TestID.RangeInputIncrement + '-1').click()
    await page.getByRole('button', { name: 'Review' }).click()
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByText('Created position')).toBeVisible()
    await expect(page).toHaveURL('/positions')
  })

  test.describe('Token sorting', () => {
    test.describe('V4', () => {
      test.describe('Native', () => {
        test('token0 and token1 are sorted', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('ETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/ETH')).not.toBeVisible()
        })
        test('token0 and token1 are not sorted', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=${USDT.address}&currencyB=NATIVE`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('ETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/ETH')).not.toBeVisible()
        })
      })

      // DAI: 0x6
      // USDT: 0xd
      test.describe('Non-native', () => {
        test('token0 and token1 are sorted', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=${USDT.address}&currencyB=${DAI.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('DAI/USDT')).toBeVisible()
          await expect(page.getByText('USDT/DAI')).not.toBeVisible()
        })

        test('token0 and token1 are not sorted', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=${DAI.address}&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('DAI/USDT')).toBeVisible()
          await expect(page.getByText('USDT/DAI')).not.toBeVisible()
        })
      })
    })

    test.describe('V3', () => {
      test.describe('Native', () => {
        test('token0 and token1 are sorted', async ({ page }) => {
          await page.goto(`/positions/create/v3?currencyA=NATIVE&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('ETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/ETH')).not.toBeVisible()
        })

        test('token0 and token1 are not sorted', async ({ page }) => {
          await page.goto(`/positions/create/v3?currencyA=${USDT.address}&currencyB=NATIVE`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('ETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/ETH')).not.toBeVisible()
        })
      })

      test.describe('Wrapped Native', () => {
        test('token0 and token1 are sorted', async ({ page }) => {
          await page.goto(`/positions/create/v3?currencyA=${WETH_ADDRESS}&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('WETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/WETH')).not.toBeVisible()
        })

        test('token0 and token1 are not sorted', async ({ page }) => {
          await page.goto(`/positions/create/v3?currencyA=${USDT.address}&currencyB=${WETH_ADDRESS}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('ETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/ETH')).not.toBeVisible()
        })
      })

      // DAI: 0x6
      // USDT: 0xd
      test.describe('Non-native', () => {
        test('token0 and token1 are sorted', async ({ page }) => {
          await page.goto(`/positions/create/v3?currencyA=${USDT.address}&currencyB=${DAI.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('DAI/USDT')).toBeVisible()
          await expect(page.getByText('USDT/DAI')).not.toBeVisible()
        })

        test('token0 and token1 are not sorted', async ({ page }) => {
          await page.goto(`/positions/create/v3?currencyA=${DAI.address}&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('DAI/USDT')).toBeVisible()
          await expect(page.getByText('USDT/DAI')).not.toBeVisible()
        })
      })
    })

    test.describe('V2', () => {
      test.describe('Native', () => {
        test('token0 and token1 are sorted', async ({ page }) => {
          await page.goto(`/positions/create/v2?currencyA=NATIVE&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('ETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/ETH')).not.toBeVisible()
        })

        test('token0 and token1 are not sorted', async ({ page }) => {
          await page.goto(`/positions/create/v2?currencyA=${USDT.address}&currencyB=NATIVE`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('ETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/ETH')).not.toBeVisible()
        })
      })

      test.describe('Wrapped Native', () => {
        test('token0 and token1 are sorted', async ({ page }) => {
          await page.goto(`/positions/create/v2?currencyA=${WETH_ADDRESS}&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('WETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/WETH')).not.toBeVisible()
        })

        test('token0 and token1 are not sorted', async ({ page }) => {
          await page.goto(`/positions/create/v2?currencyA=${USDT.address}&currencyB=${WETH_ADDRESS}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('ETH/USDT')).toBeVisible()
          await expect(page.getByText('USDT/WETH')).not.toBeVisible()
        })
      })

      // DAI: 0x6
      // USDT: 0xd
      test.describe('Non-native', () => {
        test('token0 and token1 are sorted', async ({ page }) => {
          await page.goto(`/positions/create/v2?currencyA=${USDT.address}&currencyB=${DAI.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('DAI/USDT')).toBeVisible()
          await expect(page.getByText('USDT/DAI')).not.toBeVisible()
        })

        test('token0 and token1 are not sorted', async ({ page }) => {
          await page.goto(`/positions/create/v2?currencyA=${DAI.address}&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByText('DAI/USDT')).toBeVisible()
          await expect(page.getByText('USDT/DAI')).not.toBeVisible()
        })
      })
    })
  })

  test.describe('Price range', () => {
    test.describe('V4', () => {
      test('token0 and token1 are sorted - increment/decrement', async ({ page }) => {
        await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}`)

        await waitUntilInputFilled({ page })
        await incrementDecrementPrice({ page })
      })

      test('token0 and token1 are not sorted - increment/decrement', async ({ page }) => {
        await page.goto(`/positions/create/v4?currencyA=${USDT.address}&currencyB=NATIVE`)

        await waitUntilInputFilled({ page })
        await incrementDecrementPrice({ page })
      })
    })

    test.describe('V3', () => {
      test('token0 and token1 are sorted - increment/decrement', async ({ page }) => {
        await page.goto(`/positions/create/v3?currencyA=NATIVE&currencyB=${USDT.address}`)

        await waitUntilInputFilled({ page })
        await incrementDecrementPrice({ page })
      })

      test('token0 and token1 are not sorted - increment/decrement', async ({ page }) => {
        await page.goto(`/positions/create/v3?currencyA=${USDT.address}&currencyB=NATIVE`)

        await waitUntilInputFilled({ page })
        await incrementDecrementPrice({ page })
      })
    })
  })
})

async function incrementDecrementPrice({ page }: { page: Page }) {
  // Decrement and increment the min price
  const minPrice = await page.getByTestId(TestID.RangeInput + '-0').inputValue()
  await page.getByTestId(TestID.RangeInputDecrement + '-0').click()
  const lowerMinPrice = await page.getByTestId(TestID.RangeInput + '-0').inputValue()
  expect(minPrice).toBeDefined()
  expect(Number(lowerMinPrice)).toBeLessThan(Number(minPrice))

  await page.getByTestId(TestID.RangeInputIncrement + '-0').click()
  const higherMinPrice = await page.getByTestId(TestID.RangeInput + '-0').inputValue()
  expect(Number(higherMinPrice)).toBeGreaterThan(Number(lowerMinPrice))

  // Decrement and increment the max price
  const maxPrice = await page.getByTestId(TestID.RangeInput + '-1').inputValue()
  await page.getByTestId(TestID.RangeInputDecrement + '-1').click()
  const lowerMaxPrice = await page.getByTestId(TestID.RangeInput + '-1').inputValue()
  expect(maxPrice).toBeDefined()
  expect(Number(lowerMaxPrice)).toBeLessThan(Number(maxPrice))

  await page.getByTestId(TestID.RangeInputIncrement + '-1').click()
  const higherMaxPrice = await page.getByTestId(TestID.RangeInput + '-1').inputValue()
  expect(Number(higherMaxPrice)).toBeGreaterThan(Number(lowerMaxPrice))
}

async function waitUntilInputFilled({ page }: { page: Page }) {
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(ms('2s'))
  await page.getByText('Custom range').click()
  await expect(async () => {
    const minValue = await page.getByTestId(TestID.RangeInput + '-0').inputValue()
    const maxValue = await page.getByTestId(TestID.RangeInput + '-1').inputValue()

    expect(minValue).toBeTruthy()
    expect(minValue).not.toBe('0')
    expect(maxValue).toBeTruthy()
    expect(maxValue).not.toBe('∞')
  }).toPass()
}
