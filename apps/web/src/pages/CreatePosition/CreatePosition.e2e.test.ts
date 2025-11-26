import { FeatureFlags } from '@universe/gating'
import { DEFAULT_FEE_DATA, DYNAMIC_FEE_DATA } from 'components/Liquidity/Create/types'
import { expect, getTest, type Page } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { createTestUrlBuilder } from 'playwright/fixtures/urls'
import { DAI, USDC_UNICHAIN, USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

const buildUrl = createTestUrlBuilder({
  basePath: '/positions/create',
  defaultFeatureFlags: {
    [FeatureFlags.D3LiquidityRangeChart]: false,
    [FeatureFlags.PriceRangeInputV2]: true,
  },
})

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
    test.describe('URL state parsing and persistence', () => {
      test.describe('Backwards compatibility', () => {
        test('feeTier and isDynamic', async ({ page }) => {
          const UNICHAIN_WBTC_ADDRESS = '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c'

          await page.goto(
            buildUrl({
              queryParams: {
                currencyA: 'NATIVE',
                currencyB: UNICHAIN_WBTC_ADDRESS,
                feeTier: '10000',
                chain: 'unichain',
              },
            }),
          )
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'WBTC' })).toBeVisible()
          await expect(page.getByText('1% fee tier')).toBeVisible()

          await page.goto(
            buildUrl({
              queryParams: {
                currencyA: 'NATIVE',
                currencyB: UNICHAIN_WBTC_ADDRESS,
                feeTier: DYNAMIC_FEE_DATA.feeAmount.toString(),
                chain: 'unichain',
                hook: '0xA0b0D2d00fD544D8E0887F1a3cEDd6e24Baf10cc',
              },
            }),
          )
          await expect(page.getByText('Dynamic fee tier')).toBeVisible()
          await expect(page.getByRole('button', { name: '0xA0b0...10cc' })).toBeVisible()

          // Unichain WBTC should not load on mainnet, but ETH should
          await page.goto(
            buildUrl({
              queryParams: {
                currencyA: 'NATIVE',
                currencyB: UNICHAIN_WBTC_ADDRESS,
                chain: 'mainnet',
              },
            }),
          )
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'WBTC' })).not.toBeVisible()
        })
      })

      test('parses token and normalizes currency param capitalization', async ({ page }) => {
        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencya: 'NATIVE',
              currencyb: USDT.address,
            },
          }),
        )
        // Verify native ETH is loaded as tokenA
        await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()

        // Reload to verify persistence
        await page.reload()
        const url = new URL(page.url())
        expect(url.searchParams.get('currencyA')).toBe('NATIVE')
        expect(url.searchParams.get('currencyB')).toBe(USDT.address)
        expect(url.searchParams.get('currencya')).toBe(null)
        expect(url.searchParams.get('currencyb')).toBe(null)
      })

      test('parses simple query params and resets', async ({ page }) => {
        await page.goto(
          buildUrl({
            subPath: '/v2',
            queryParams: {
              currencyB: USDT.address,
            },
          }),
        )
        // Should default to native token when currencyA is missing
        await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()
        // Should allow for reset
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.getByRole('button', { name: 'Reset' }).click()
        // Confirm reset
        await page.getByRole('button', { name: 'Reset' }).click()
        const url = new URL(page.url())
        await expect(url.pathname).toContain(`/positions/create/v2`)
        await expect(page.getByRole('button', { name: 'New v2 position' })).not.toBeVisible()
      })

      test('parses complex query params', async ({ page }) => {
        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: 'NATIVE',
              currencyB: '0x2416092f143378750bb29b79ed961ab195cceea5',
              chain: 'unichain',
              hook: '0x09DEA99D714A3a19378e3D80D1ad22Ca46085080',
              priceRangeState:
                '{"priceInverted":true,"fullRange":false,"minPrice":"0.00019382924070396673","maxPrice":"0.000350504530738769","initialPrice":"0.000025"}',
              fee: JSON.stringify({ ...DEFAULT_FEE_DATA, isDynamic: true }),
            },
          }),
        )
        const url = new URL(page.url())

        // Verify chain
        expect(url.searchParams.get('chain')).toBe('unichain')
        // Verify fee tier
        await expect(page.getByText('Dynamic fee tier')).toBeVisible()
        // Verify hook
        await expect(page.getByRole('button', { name: '0x09DE' })).toBeVisible()
        await expect(page.getByText('Add a hook')).not.toBeVisible()
        // Continue to second step
        await page.getByRole('button', { name: 'Continue' }).click()
        // Hook confirmation modal must be dismissed
        await page.getByTestId(TestID.HookModalContinueButton).click()

        // Verify price range state
        const priceRange = JSON.parse(url.searchParams.get('priceRangeState')!)
        expect(priceRange.priceInverted, 'priceInverted').toBe(true)
        expect(priceRange.fullRange, 'fullRange').toBe(false)
        expect(priceRange.minPrice, 'minPrice').toBe('0.00019382924070396673')
        expect(priceRange.maxPrice, 'maxPrice').toBe('0.000350504530738769')
        expect(priceRange.initialPrice, 'initialPrice').toBe('0.000025')
        const minPriceInput = page.getByTestId(TestID.RangeInput + '-0').first()
        const maxPriceInput = page.getByTestId(TestID.RangeInput + '-1').first()
        await expect(minPriceInput).toHaveValue(/0\.000193/)
        await expect(maxPriceInput).toHaveValue(/0\.000350/)
      })

      test('handles step 1 data correctly', async ({ page }) => {
        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              step: '1',
              currencyA: 'NATIVE',
              currencyB: USDT.address,
              depositState: '{"exactField":"TOKEN0","exactAmounts":{"TOKEN0":"1.25"}}',
            },
          }),
        )
        const url = new URL(page.url())
        // Verify deposit state
        const depositState = JSON.parse(url.searchParams.get('depositState')!)
        expect(depositState.exactField, 'exactField').toBe('TOKEN0')
        expect(depositState.exactAmounts.TOKEN0, 'exactAmounts.TOKEN0').toBe('1.25')
        const ethInput = page.getByTestId(TestID.AmountInputIn).first()
        await expect(ethInput).toHaveValue('1.25')
      })

      test('historyState is set from URL', async ({ page }) => {
        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: 'NATIVE',
              currencyB: USDT.address,
              step: '0',
            },
          }),
        )

        await expect(page.getByText('Select pair')).toBeVisible()

        await page.getByRole('button', { name: 'Continue' }).click()

        await expect(page.getByText('Deposit tokens')).toBeVisible()
        const url = new URL(page.url())
        expect(url.searchParams.get('step')).toBe('1')

        await page.goBack()

        await expect(page.getByText('Select pair')).toBeVisible()
        const url2 = new URL(page.url())
        expect(url2.searchParams.get('step')).toBe('0')

        await page.goForward()

        await expect(page.getByText('Deposit tokens')).toBeVisible()
        const url3 = new URL(page.url())
        expect(url3.searchParams.get('step')).toBe('1')
      })

      test('prevents invalid params', async ({ page }) => {
        // Duplicated token addresses and invalid param values
        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: USDT.address,
              currencyB: USDT.address,
              hook: 'invalid-address',
              chain: 'invalid-chain',
              step: '99',
            },
          }),
        )
        // Should show USDT for tokenA and "Choose token" for tokenB (duplicate prevented)
        await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Choose token' })).toBeVisible()
        // Should not show any hook button when invalid
        await expect(page.getByText('Add a hook')).toBeVisible()
        // Should fall back to default step
        await expect(page.getByText('Select pair')).toBeVisible()

        // ETH/WETH conflicts
        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: 'NATIVE',
              currencyB: WETH_ADDRESS,
            },
          }),
        )
        // Should show ETH for tokenA and "Choose token" for tokenB (ETH/WETH conflict prevented)
        await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Choose token' })).toBeVisible()
      })
    })

    test.describe('Token sorting', () => {
      test.describe('V4', () => {
        test('native token0 and token1 are sorted correctly', async ({ page }) => {
          await page.goto(
            buildUrl({
              subPath: '/v4',
              queryParams: {
                currencyA: 'NATIVE',
                currencyB: USDT.address,
              },
            }),
          )
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByTestId(TestID.PoolPairLabel)).toHaveText(/ETH.*USDT/)
          await expect(page.getByTestId(TestID.PoolPairLabel)).not.toHaveText(/USDT.*ETH/)

          await page.goto(
            buildUrl({
              subPath: '/v4',
              queryParams: {
                currencyA: USDT.address,
                currencyB: 'NATIVE',
              },
            }),
          )
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByTestId(TestID.PoolPairLabel)).toHaveText(/ETH.*USDT/)
          await expect(page.getByTestId(TestID.PoolPairLabel)).not.toHaveText(/USDT.*ETH/)
        })

        test('Non-native token0 and token1 are sorted', async ({ page }) => {
          await page.goto(
            buildUrl({
              subPath: '/v4',
              queryParams: {
                currencyA: USDT.address,
                currencyB: DAI.address,
              },
            }),
          )
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByTestId(TestID.PoolPairLabel)).toHaveText(/DAI.*USDT/)
          await expect(page.getByTestId(TestID.PoolPairLabel)).not.toHaveText(/USDT.*DAI/)

          await page.goto(
            buildUrl({
              subPath: '/v4',
              queryParams: {
                currencyA: DAI.address,
                currencyB: USDT.address,
              },
            }),
          )
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByTestId(TestID.PoolPairLabel)).toHaveText(/DAI.*USDT/)
          await expect(page.getByTestId(TestID.PoolPairLabel)).not.toHaveText(/USDT.*DAI/)
        })
      })

      test.describe('V3', () => {
        test('native token0 and token1 are sorted correctly', async ({ page }) => {
          await page.goto(
            buildUrl({
              subPath: '/v3',
              queryParams: {
                currencyA: USDT.address,
                currencyB: 'NATIVE',
              },
            }),
          )
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByTestId(TestID.PoolPairLabel)).toHaveText(/ETH.*USDT/)
          await expect(page.getByTestId(TestID.PoolPairLabel)).not.toHaveText(/USDT.*ETH/)
        })

        test('wrapped native token0 and token1 are sorted correctly', async ({ page }) => {
          await page.goto(
            buildUrl({
              subPath: '/v3',
              queryParams: {
                currencyA: USDT.address,
                currencyB: WETH_ADDRESS,
              },
            }),
          )
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByTestId(TestID.PoolPairLabel)).toHaveText(/WETH.*USDT/)
          await expect(page.getByTestId(TestID.PoolPairLabel)).not.toHaveText(/USDT.*WETH/)
        })

        test('non-native token0 and token1 are sorted correctly', async ({ page }) => {
          await page.goto(
            buildUrl({
              subPath: '/v3',
              queryParams: {
                currencyA: USDT.address,
                currencyB: DAI.address,
              },
            }),
          )
          await page.getByRole('button', { name: 'Continue' }).click()
          await expect(page.getByTestId(TestID.PoolPairLabel)).toHaveText(/DAI.*USDT/)
          await expect(page.getByTestId(TestID.PoolPairLabel)).not.toHaveText(/USDT.*DAI/)
        })
      })
    })

    test.describe('Price range', () => {
      const priceRangeQueryParams = {
        step: '1',
        fee: '{"feeAmount":3000,"tickSpacing":60,"isDynamic":false}',
        priceRangeState:
          '{"priceInverted":false,"fullRange":false,"minPrice":"2500","maxPrice":"5000","initialPrice":""}',
      }

      test('V4 can increment/decrement price range correctly', async ({ page }) => {
        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: 'NATIVE',
              currencyB: USDT.address,
              ...priceRangeQueryParams,
            },
          }),
        )

        await expectInputToBeFilled({ page })
        await incrementDecrementPrice({ page })
      })

      test('V3 can increment/decrement price range correctly', async ({ page }) => {
        await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
        await page.goto(
          buildUrl({
            subPath: '/v3',
            queryParams: {
              currencyA: USDT.address,
              currencyB: 'NATIVE',
              ...priceRangeQueryParams,
            },
          }),
        )
        await expectInputToBeFilled({ page })
        await incrementDecrementPrice({ page })
      })
    })
  },
)

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

async function expectInputToBeFilled({ page }: { page: Page }) {
  await expect(async () => {
    const minValue = await page.getByTestId(TestID.RangeInput + '-0').inputValue()
    const maxValue = await page.getByTestId(TestID.RangeInput + '-1').inputValue()

    expect(minValue).toBeTruthy()
    expect(minValue).not.toBe('0')
    expect(maxValue).toBeTruthy()
    expect(maxValue).not.toBe('∞')
  }).toPass()
}
