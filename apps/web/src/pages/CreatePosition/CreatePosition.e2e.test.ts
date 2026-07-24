import { V1_TRADING_API_PATHS } from '@universe/api'
import { DAI, USDT } from 'uniswap/src/constants/tokens'
import { DYNAMIC_FEE_DATA } from 'uniswap/src/features/positions/types'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getUniswapServiceUrls } from '~/config'
import { DEFAULT_FEE_DATA } from '~/features/Liquidity/Create/types'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { stubTradingApiEndpoint } from '~/playwright/fixtures/tradingApi'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'

const test = getTest()

const buildUrl = createTestUrlBuilder({
  basePath: '/positions/create',
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
        await page.getByRole('button', { name: 'Reset' }).last().click()
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
                '{"priceInverted":true,"fullRange":false,"minTick":-85500,"maxTick":-79560,"initialPrice":"0.000025"}',
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
        await expect(page.getByTestId(TestID.HookAddButton)).not.toBeVisible()
        // Continue to second step
        await page.getByRole('button', { name: 'Continue' }).click()
        // Hook confirmation modal must be dismissed
        await page.getByTestId(TestID.HookModalContinueButton).click()

        // Verify price range state
        const priceRange = JSON.parse(url.searchParams.get('priceRangeState')!)
        expect(priceRange.priceInverted, 'priceInverted').toBe(true)
        expect(priceRange.fullRange, 'fullRange').toBe(false)
        expect(priceRange.minTick, 'minTick').toBe(-85500)
        expect(priceRange.maxTick, 'maxTick').toBe(-79560)
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
              fee: '{"isDynamic":false,"feeAmount":500,"tickSpacing":10}',
            },
          }),
        )
        const url = new URL(page.url())
        // Verify deposit state
        const depositState = JSON.parse(url.searchParams.get('depositState')!)
        expect(depositState.exactField, 'exactField').toBe('TOKEN0')
        expect(depositState.exactAmounts.TOKEN0, 'exactAmounts.TOKEN0').toBe('1.25')
        await expect(page.getByText('Enter an amount')).toBeVisible()
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
        await expect(page.getByTestId(TestID.HookAddButton)).toBeVisible()
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

    test.describe('Hook search modal', () => {
      const MOCK_HOOK_LIST_RESPONSE = {
        hooks: [
          {
            address: '0x1234567890123456789012345678901234567890',
            chain: 'Ethereum',
            chainId: 1,
            name: 'Dynamic Fee Hook',
            description: 'Adjusts fees dynamically',
            verifiedSource: true,
            flags: { beforeSwap: true, afterSwap: true },
          },
          {
            address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            chain: 'Ethereum',
            chainId: 1,
            name: 'MEV Protection Hook',
            description: 'Protects against MEV',
            verifiedSource: false,
            flags: { beforeSwap: true },
          },
        ],
      }

      test('opens hook search modal and selects a hook', async ({ page }) => {
        await page.route(
          `${getUniswapServiceUrls().liquidityServiceUrl}/uniswap.liquidity.v2.LiquidityService/HookList*`,
          async (route) => {
            await route.fulfill({
              status: 200,
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(MOCK_HOOK_LIST_RESPONSE),
            })
          },
        )

        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: 'NATIVE',
              currencyB: USDT.address,
            },
          }),
        )

        // Click the "Add a hook" line item's search button to open the modal
        await page.getByTestId(TestID.HookSelectButton).click()

        // Verify modal is open with hook list
        await expect(page.getByText('Dynamic Fee Hook')).toBeVisible()
        await expect(page.getByText('MEV Protection Hook')).toBeVisible()

        // Select the first hook via its hover-revealed add button
        await page.getByText('Dynamic Fee Hook').hover()
        await page.getByTestId(TestID.HookRowAddButton).first().click()

        // Verify the selected hook appears in the form
        await expect(page.getByText('Dynamic Fee Hook')).toBeVisible()
        await expect(page.getByText('0x1234...7890')).toBeVisible()
      })

      test('shows empty state when no hooks match search', async ({ page }) => {
        await page.route(
          `${getUniswapServiceUrls().liquidityServiceUrl}/uniswap.liquidity.v2.LiquidityService/HookList*`,
          async (route) => {
            await route.fulfill({
              status: 200,
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ hooks: [] }),
            })
          },
        )

        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: 'NATIVE',
              currencyB: USDT.address,
            },
          }),
        )

        await page.getByTestId(TestID.HookSelectButton).click()

        await expect(page.getByText('No hooks found')).toBeVisible()
      })

      test('adds an unregistered hook address from search', async ({ page }) => {
        await page.route(
          `${getUniswapServiceUrls().liquidityServiceUrl}/uniswap.liquidity.v2.LiquidityService/HookList*`,
          async (route) => {
            await route.fulfill({
              status: 200,
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ hooks: [] }),
            })
          },
        )

        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: 'NATIVE',
              currencyB: USDT.address,
            },
          }),
        )

        await page.getByTestId(TestID.HookSelectButton).click()

        // Search an address that isn't in the registry: a selectable entry is shown instead of the empty state
        const unregisteredAddress = '0x0000000000000000000000000000000000004444'
        await page.getByPlaceholder('Search by name or address').fill(unregisteredAddress)
        await expect(page.getByText('0x0000...4444')).toBeVisible()
        await expect(page.getByText('No hooks found')).not.toBeVisible()

        await page.getByTestId(TestID.HookRowAddButton).click()

        // Verify the raw address is set as the selected hook
        await expect(page.getByText('0x0000...4444')).toBeVisible()
        await expect(page.getByTestId(TestID.HookAddButton)).not.toBeVisible()
      })

      test('clears selected hook with X button', async ({ page }) => {
        await page.route(
          `${getUniswapServiceUrls().liquidityServiceUrl}/uniswap.liquidity.v2.LiquidityService/HookList*`,
          async (route) => {
            await route.fulfill({
              status: 200,
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(MOCK_HOOK_LIST_RESPONSE),
            })
          },
        )

        await page.goto(
          buildUrl({
            subPath: '/v4',
            queryParams: {
              currencyA: 'NATIVE',
              currencyB: USDT.address,
            },
          }),
        )

        await page.getByTestId(TestID.HookSelectButton).click()
        await page.getByText('Dynamic Fee Hook').hover()
        await page.getByTestId(TestID.HookRowAddButton).first().click()

        // Verify hook is selected
        await expect(page.getByText('Dynamic Fee Hook')).toBeVisible()

        // Clear the hook
        await page.getByTestId(TestID.HookClearButton).click()

        // Verify hook is cleared and "Add a hook" is back
        await expect(page.getByTestId(TestID.HookAddButton)).toBeVisible()
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

      test('V4 can increment/decrement price range correctly', async ({ page, graphql }) => {
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

        await graphql.waitForResponse('PoolPriceHistory')
        await graphql.waitForResponse('AllV4Ticks')
        await expectInputToBeFilled({ page })
        await incrementDecrementPrice({ page })
      })

      test('V3 can increment/decrement price range correctly', async ({ page, graphql }) => {
        await stubTradingApiEndpoint({ page, endpoint: V1_TRADING_API_PATHS.quote })
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
        await graphql.waitForResponse('PoolPriceHistory')
        await expectInputToBeFilled({ page })
        await incrementDecrementPrice({ page })
      })
    })
  },
)

async function incrementDecrementPrice({ page }: { page: Page }) {
  const minInput = page.getByTestId(TestID.RangeInput + '-0')
  const maxInput = page.getByTestId(TestID.RangeInput + '-1')

  // Decrement and increment the min price
  const minPrice = await minInput.inputValue()
  expect(minPrice).toBeDefined()
  await expect(async () => {
    await page.getByTestId(TestID.RangeInputDecrement + '-0').click()
    expect(Number(await minInput.inputValue())).toBeLessThan(Number(minPrice))
  }).toPass({ timeout: 5000 })

  const lowerMinPrice = await minInput.inputValue()
  await expect(async () => {
    await page.getByTestId(TestID.RangeInputIncrement + '-0').click()
    expect(Number(await minInput.inputValue())).toBeGreaterThan(Number(lowerMinPrice))
  }).toPass({ timeout: 5000 })

  // Decrement and increment the max price
  const maxPrice = await maxInput.inputValue()
  expect(maxPrice).toBeDefined()
  await expect(async () => {
    await page.getByTestId(TestID.RangeInputDecrement + '-1').click()
    expect(Number(await maxInput.inputValue())).toBeLessThan(Number(maxPrice))
  }).toPass({ timeout: 5000 })

  const lowerMaxPrice = await maxInput.inputValue()
  await expect(async () => {
    await page.getByTestId(TestID.RangeInputIncrement + '-1').click()
    expect(Number(await maxInput.inputValue())).toBeGreaterThan(Number(lowerMaxPrice))
  }).toPass({ timeout: 5000 })
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
