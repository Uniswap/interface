import { getPosition } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { createExpectSingleTransaction } from 'playwright/anvil/transactions'
import { expect, getTest } from 'playwright/fixtures'
import { DEFAULT_TEST_GAS_LIMIT, stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { Mocks } from 'playwright/mocks/mocks'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const test = getTest({ withAnvil: true })

const ANIMATION_DELAY = 100

test.describe('Migrate V3', () => {
  test('should migrate from v3 to v4', async ({ page, anvil }) => {
    const expectSingleTransaction = createExpectSingleTransaction({
      anvil,
      address: TEST_WALLET_ADDRESS,
      options: { blocks: 2 },
    })

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

    await expectSingleTransaction(async () => {
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForTimeout(ANIMATION_DELAY)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Migrate' }).click()
      await expect(page.getByText('Migrating liquidity')).toBeVisible()
    })
  })

  test('should migrate a single sided position from v3 to v4', async ({ page, anvil }) => {
    const expectSingleTransaction = createExpectSingleTransaction({
      anvil,
      address: TEST_WALLET_ADDRESS,
      options: { blocks: 2 },
    })

    await stubTradingApiEndpoint({
      page,
      endpoint: uniswapUrls.tradingApiPaths.migrate,
      modifyResponseData: (data) => {
        try {
          data.migrate.gasLimit = DEFAULT_TEST_GAS_LIMIT
          return data
        } catch (_error) {
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

    await expectSingleTransaction(async () => {
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.waitForTimeout(ANIMATION_DELAY)
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Migrate' }).click()
      await expect(page.getByText('Migrating liquidity')).toBeVisible()
    })
  })
})
