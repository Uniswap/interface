import { DYNAMIC_FEE_DATA } from 'components/Liquidity/Create/types'
import ms from 'ms'
import { expect, getTest, type Page } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { DAI, USDC_UNICHAIN, USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

const WETH_ADDRESS = WETH.address

test.describe('Create position', () => {
  test.describe('URL state persistence', () => {
    test.describe('Backwards compatibility', () => {
      test('feeTier and isDynamic', async ({ page }) => {
        const UNICHAIN_WBTC_ADDRESS = '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c'

        await page.goto(
          `/positions/create?currencyA=NATIVE&currencyB=${UNICHAIN_WBTC_ADDRESS}&feeTier=10000&chain=unichain`,
        )
        await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'WBTC' })).toBeVisible()
        await expect(page.getByText('1% fee tier')).toBeVisible()

        await page.goto(
          `/positions/create?currencyA=NATIVE&currencyB=${UNICHAIN_WBTC_ADDRESS}&feeTier=${DYNAMIC_FEE_DATA.feeAmount}&chain=unichain&hook=0xA0b0D2d00fD544D8E0887F1a3cEDd6e24Baf10cc`,
        )
        await expect(page.getByText('Dynamic fee tier')).toBeVisible()
        await expect(page.getByRole('button', { name: '0xA0b0...10cc' })).toBeVisible()

        // Unichain WBTC should not load on mainnet, but ETH should
        await page.goto(`/positions/create?currencyA=NATIVE&currencyB=${UNICHAIN_WBTC_ADDRESS}&chain=mainnet`)
        await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'WBTC' })).not.toBeVisible()
      })

      test('currencya and currencyb', async ({ page }) => {
        await page.goto(`/positions/create?currencya=NATIVE&currencyb=${USDT.address}`)
        await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()

        await page.reload()
        const url = new URL(page.url())
        expect(url.searchParams.get('currencyA')).toBe('NATIVE')
        expect(url.searchParams.get('currencyB')).toBe(USDT.address)
        expect(url.searchParams.get('currencya')).toBe(null)
        expect(url.searchParams.get('currencyb')).toBe(null)
      })
    })

    test.describe('Individual field parsing', () => {
      test.describe('protocolVersion parsing', () => {
        test('parses protocolVersion and resets', async ({ page }) => {
          await page.goto(`/positions/create/v2?currencyA=NATIVE&currencyB=${USDT.address}`)
          await page.getByRole('button', { name: 'Continue' }).click()
          await page.getByRole('button', { name: 'Reset' }).click()
          // Confirm reset
          await page.getByRole('button', { name: 'Reset' }).click()
          const url = new URL(page.url())
          await expect(url.pathname).toBe(`/positions/create/v2`)
          await expect(page.getByRole('button', { name: 'New v2 position' })).not.toBeVisible()
        })
      })

      test.describe('tokenA and tokenB parsing', () => {
        test('parses native token as tokenA', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}`)

          // Verify native ETH is loaded as tokenA
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()
        })

        test('handles missing currencyA with default token', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyB=${USDT.address}`)

          // Should default to native token when currencyA is missing
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()
        })

        test('handles missing currencyB', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE`)

          // Should show tokenA and "Choose token" for tokenB
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'Choose token' })).toBeVisible()
        })

        test('prevents duplicate tokens (same address)', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=${USDT.address}&currencyB=${USDT.address}`)

          // Should show USDT for tokenA and "Choose token" for tokenB (duplicate prevented)
          await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'Choose token' })).toBeVisible()
        })

        test('prevents ETH/WETH conflicts', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${WETH_ADDRESS}`)

          // Should show ETH for tokenA and "Choose token" for tokenB (ETH/WETH conflict prevented)
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'Choose token' })).toBeVisible()
        })
      })

      test.describe('fee parsing', () => {
        test('parses standard fee tiers', async ({ page }) => {
          await page.goto(
            `/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&fee={"feeAmount":500,"tickSpacing":10,"isDynamic":false}`,
          )

          await expect(page.getByText('0.05% fee tier').first()).toBeVisible()
        })

        test('parses dynamic fee tier', async ({ page }) => {
          await page.goto(
            `/positions/create/v4?currencyA=NATIVE&currencyB=0x2416092f143378750bb29b79ed961ab195cceea5&chain=unichain&hook=0x09DEA99D714A3a19378e3D80D1ad22Ca46085080&isDynamic=true&priceRangeState={"priceInverted":false,"fullRange":true,"minPrice":"","maxPrice":"","initialPrice":""}&depositState={"exactField":"TOKEN0","exactAmounts":{}}&fee={"isDynamic":true,"feeAmount":100,"tickSpacing":1}`,
          )

          await expect(page.getByText('Dynamic fee tier')).toBeVisible()
        })
      })

      test.describe('hook parsing', () => {
        test('parses valid hook address', async ({ page }) => {
          await page.goto(
            `/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&hook=0xA0b0D2d00fD544D8E0887F1a3cEDd6e24Baf10cc`,
          )

          await expect(page.getByRole('button', { name: '0xA0b0...10cc' })).toBeVisible()
          await expect(page.getByText('Add a hook')).not.toBeVisible()
        })

        test('handles invalid hook address', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&hook=invalid-address`)

          // Should not show any hook button when invalid
          await expect(page.getByText('Add a hook')).toBeVisible()
        })
      })

      test.describe('chainId parsing', () => {
        test('parses explicit chain parameter', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDC_UNICHAIN.address}&chain=unichain`)

          // Verify we're on unichain by checking the url
          const url = new URL(page.url())
          expect(url.searchParams.get('chain')).toBe('unichain')
        })

        test('uses default chain when missing', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}`)

          // Should default to mainnet
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()
        })

        test('handles invalid chain with fallback', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&chain=invalid-chain`)

          // Should fall back to default chain
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
        })
      })

      test.describe('flowStep parsing', () => {
        test('parses step 0 (token selection)', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&step=0`)

          await expect(page.getByText('Select pair')).toBeVisible()
          await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
        })

        test('parses step 1 (price range and deposit)', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&step=1`)

          await expect(page.getByText('Deposit tokens')).toBeVisible()
          await expect(page.getByText('Full range').first()).toBeVisible()
        })

        test('handles missing step with default', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}`)

          // Should default to step 0
          await expect(page.getByText('Select pair')).toBeVisible()
        })

        test('handles invalid step with default', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&step=99`)

          // Should fall back to default step
          await expect(page.getByText('Select pair')).toBeVisible()
        })

        test('historyState is set from URL', async ({ page }) => {
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&step=0`)

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
      })

      test.describe('loading state', () => {
        test('shows loading indicators during token resolution', async ({ page }) => {
          // Navigate to a URL with tokens that might take time to load
          await page.goto(`/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}`)

          // This is harder to test reliably in e2e since loading is usually fast
          // We can at least verify the page loads successfully
          await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
          await expect(page.getByRole('button', { name: 'USDT' })).toBeVisible()
        })
      })
    })

    test.describe('Price range state', () => {
      test('parses and restores complete priceRange state from URL', async ({ page }) => {
        // Test URL with all PriceRangeState fields populated
        const testUrl = `/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&step=1&priceRangeState={"priceInverted":true,"fullRange":false,"minPrice":"0.00019382924070396673","maxPrice":"0.000350504530738769","initialPrice":""}&chain=ethereum&hook=undefined&depositState={"exactField":"TOKEN1","exactAmounts":{}}`

        await page.goto(testUrl)

        // Verify all price range fields are correctly parsed and applied
        const url = new URL(page.url())
        const priceRange = JSON.parse(url.searchParams.get('priceRangeState')!)

        expect(priceRange.priceInverted).toBe(true)
        expect(priceRange.fullRange).toBe(false)
        expect(priceRange.minPrice).toBe('0.00019382924070396673')
        expect(priceRange.maxPrice).toBe('0.000350504530738769')
        expect(priceRange.initialPrice).toBe('')

        // Verify UI reflects the parsed state
        await expect(page.getByText('ETH = 1 USDT').first()).toBeVisible() // priceInverted: true
        await expect(page.getByRole('button', { name: 'Custom range' })).toHaveAttribute('data-state', 'active') // fullRange: false

        const minPriceInput = page.getByTestId(TestID.RangeInput + '-0')
        const maxPriceInput = page.getByTestId(TestID.RangeInput + '-1')
        await expect(minPriceInput).toHaveValue('0.00019432562')
        await expect(maxPriceInput).toHaveValue('0.00034985046')

        // Reload and verify persistence
        await page.reload()

        const reloadedUrl = new URL(page.url())
        const reloadedPriceRange = JSON.parse(reloadedUrl.searchParams.get('priceRangeState')!)

        expect(reloadedPriceRange.priceInverted).toBe(true)
        expect(reloadedPriceRange.fullRange).toBe(false)
        expect(reloadedPriceRange.minPrice).toBe('0.00019382924070396673')
        expect(reloadedPriceRange.maxPrice).toBe('0.000350504530738769')
        expect(reloadedPriceRange.initialPrice).toBe('')
      })

      test('restores initialPrice from URL with random token', async ({ page }) => {
        // Random sh*t coin 0x2621Cb9FE8921351E9558D4CD8666688e1DcD689
        const randomCoin = '0x2621Cb9FE8921351E9558D4CD8666688e1DcD689'

        await page.goto(
          `/positions/create/v4?currencyA=NATIVE&currencyB=${randomCoin}&step=1&priceRangeState={"priceInverted":false,"fullRange":false,"minPrice":"2991.7083","maxPrice":"3990.1553","initialPrice":"3500.75","isInitialPriceDirty":true}`,
        )

        // Verify price inputs are populated
        const minPriceInput = page.getByTestId(TestID.RangeInput + '-0')
        const maxPriceInput = page.getByTestId(TestID.RangeInput + '-1')
        await expect(minPriceInput).toHaveValue('2991.7083')
        await expect(maxPriceInput).toHaveValue('3990.1553')

        // Reload and verify all price range state is preserved
        await page.reload()

        const url = new URL(page.url())
        const priceRange = JSON.parse(url.searchParams.get('priceRangeState')!)
        expect(priceRange.minPrice).toBe('2991.7083')
        expect(priceRange.maxPrice).toBe('3990.1553')
        expect(priceRange.initialPrice).toBe('3500.75')
        expect(priceRange.fullRange).toBe(false)
        expect(priceRange.priceInverted).toBe(false)
        expect(priceRange.isInitialPriceDirty).toBe(true)

        await expect(minPriceInput).toHaveValue('2991.7083')
        await expect(maxPriceInput).toHaveValue('3990.1553')
      })
    })

    test.describe('Deposit state', () => {
      test('parses and restores complete depositState from URL with TOKEN0 exact field', async ({ page }) => {
        // Test URL with TOKEN0 as exact field (TOKEN1 will be calculated)
        const testUrl = `/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&step=1&depositState={"exactField":"TOKEN0","exactAmounts":{"TOKEN0":"1.25","TOKEN1":""}}`

        await page.goto(testUrl)

        // Verify deposit state fields are correctly parsed
        const url = new URL(page.url())
        const depositState = JSON.parse(url.searchParams.get('depositState')!)

        expect(depositState.exactField).toBe('TOKEN0')
        expect(depositState.exactAmounts.TOKEN0).toBe('1.25')
        expect(depositState.exactAmounts.TOKEN1).toBe('')

        // Verify UI reflects the parsed state
        const ethInput = page.getByTestId(TestID.AmountInputIn).first()

        await expect(ethInput).toHaveValue('1.25')

        // Reload and verify persistence
        await page.reload()

        const reloadedUrl = new URL(page.url())
        const reloadedDepositState = JSON.parse(reloadedUrl.searchParams.get('depositState')!)

        expect(reloadedDepositState.exactField).toBe('TOKEN0')
        expect(reloadedDepositState.exactAmounts.TOKEN0).toBe('1.25')
        expect(reloadedDepositState.exactAmounts.TOKEN1).toBe('')

        await expect(ethInput).toHaveValue('1.25')
      })

      test('parses and restores complete depositState from URL with TOKEN1 exact field', async ({ page }) => {
        // Test URL with TOKEN1 as exact field (TOKEN0 will be calculated)
        const testUrl = `/positions/create/v4?currencyA=NATIVE&currencyB=${USDT.address}&step=1&depositState={"exactField":"TOKEN1","exactAmounts":{"TOKEN0":"","TOKEN1":"3500.50"}}`

        await page.goto(testUrl)

        // Verify deposit state fields are correctly parsed
        const url = new URL(page.url())
        const depositState = JSON.parse(url.searchParams.get('depositState')!)

        expect(depositState.exactField).toBe('TOKEN1')
        expect(depositState.exactAmounts.TOKEN0).toBe('')
        expect(depositState.exactAmounts.TOKEN1).toBe('3500.50')

        // Verify UI reflects the parsed state
        const usdtInput = page.getByTestId(TestID.AmountInputIn).last()

        await expect(usdtInput).toHaveValue('3500.50')

        // Reload and verify persistence
        await page.reload()

        const reloadedUrl = new URL(page.url())
        const reloadedDepositState = JSON.parse(reloadedUrl.searchParams.get('depositState')!)

        expect(reloadedDepositState.exactField).toBe('TOKEN1')
        expect(reloadedDepositState.exactAmounts.TOKEN0).toBe('')
        expect(reloadedDepositState.exactAmounts.TOKEN1).toBe('3500.50')

        await expect(usdtInput).toHaveValue('3500.50')
      })
    })
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
        await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
        await page.goto(`/positions/create/v3?currencyA=NATIVE&currencyB=${USDT.address}`)
        await waitUntilInputFilled({ page })
        await incrementDecrementPrice({ page })
      })

      test('token0 and token1 are not sorted - increment/decrement', async ({ page }) => {
        await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
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
