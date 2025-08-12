import { getPosition } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { ONE_MILLION_USDT } from 'playwright/anvil/utils'
import { expect, test } from 'playwright/fixtures'
import { DEFAULT_TEST_GAS_LIMIT, stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { Mocks } from 'playwright/mocks/mocks'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'

test.describe('Migrate V3', () => {
  test('should migrate from v3 to v4', async ({ page }) => {
    await stubTradingApiEndpoint({
      page,
      endpoint: uniswapUrls.tradingApiPaths.migrate,
      modifyResponseData: (data) => {
        data.migrate.gasLimit = DEFAULT_TEST_GAS_LIMIT
        return data
      },
    })
    await page.route(
      `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
      async (route) => {
        await route.fulfill({ path: Mocks.Positions.get_v3_position })
      },
    )
    await page.goto('/migrate/v3/ethereum/1028438')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Migrate' }).click()
    await expect(page.getByText('Migrating liquidity')).toBeVisible()
  })

  test('should migrate a single sided position from v3 to v4', async ({ page }) => {
    await stubTradingApiEndpoint({
      page,
      endpoint: uniswapUrls.tradingApiPaths.migrate,
      modifyResponseData: (data) => {
        try {
          data.migrate.gasLimit = DEFAULT_TEST_GAS_LIMIT
          return data
        } catch (error) {
          return data
        }
      },
    })
    await page.route(
      `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
      async (route) => {
        await route.fulfill({ path: Mocks.Positions.get_single_sided_v3_position })
      },
    )
    await page.goto('/migrate/v3/ethereum/1035132')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Migrate' }).click()
    await expect(page.getByText('Migrating liquidity')).toBeVisible()
  })

  test.describe('error handling', () => {
    test('should gracefully handle errors during review', async ({ page }) => {
      await page.route(
        `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
        async (route) => {
          await route.fulfill({ path: Mocks.Positions.get_v3_position })
        },
      )
      await page.goto('/migrate/v3/ethereum/1035132')
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Migrate' }).click()
      await expect(page.getByText('Something went wrong')).toBeVisible()
      await expect(page.getByText('There was an error fetching data required for your transaction.')).toBeVisible()
      await page.getByTestId(TestID.LiquidityModalHeaderClose).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page.getByText('Something went wrong')).not.toBeVisible()
    })

    test('should gracefully handle errors when approved and permit2 is not needed', async ({ page, anvil }) => {
      await page.route(
        `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
        async (route) => {
          await route.fulfill({ path: Mocks.Positions.get_v3_position })
        },
      )
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.migrate })
      await stubTradingApiEndpoint({
        page,
        endpoint: uniswapUrls.tradingApiPaths.lpApproval,
        modifyResponseData: (data) => {
          return {
            ...data,
            permitData: null,
          }
        },
      })
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await anvil.setErc20Allowance({ address: assume0xAddress(USDT.address), spender: PERMIT2_ADDRESS, amount: 1n })
      await anvil.setPermit2Allowance({
        owner: TEST_WALLET_ADDRESS,
        token: assume0xAddress(USDT.address),
        spender: assume0xAddress(UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, UniverseChainId.Mainnet)),
      })

      await page.goto('/migrate/v3/ethereum/1035132')
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Migrate' }).click()
      await expect(page.getByText('Something went wrong')).toBeVisible()
      await expect(page.getByText('There was an error fetching data required for your transaction.')).toBeVisible()
    })
  })
})
