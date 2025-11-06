import { getPosition } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { createExpectSingleTransaction } from 'playwright/anvil/transactions'
import { expect, getTest } from 'playwright/fixtures'
import { DEFAULT_TEST_GAS_LIMIT, stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { Mocks } from 'playwright/mocks/mocks'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest({ withAnvil: true })

test.describe('Claim fees', () => {
  test('should claim fees from a v3 position', async ({ page, anvil }) => {
    const expectSingleTransaction = createExpectSingleTransaction({
      anvil,
      address: TEST_WALLET_ADDRESS,
      options: { blocks: 2 },
    })

    await stubTradingApiEndpoint({
      page,
      endpoint: uniswapUrls.tradingApiPaths.claimLpFees,
      modifyResponseData: (data) => {
        data.claim.gasLimit = DEFAULT_TEST_GAS_LIMIT
        return data
      },
    })
    await page.route(
      `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
      async (route) => {
        await route.fulfill({ path: Mocks.Positions.get_v3_position })
      },
    )
    await page.goto('/positions/v3/ethereum/1028438')

    // Perform fee claiming and verify transaction was submitted
    await expectSingleTransaction(async () => {
      await page.getByRole('button', { name: 'Collect fees' }).click()
      await page.getByTestId(TestID.ClaimFees).click()
      await expect(page.getByText('Collecting fees')).toBeVisible()
    })
  })

  test('should claim fees from a v4 position', async ({ page, anvil }) => {
    const expectSingleTransaction = createExpectSingleTransaction({
      anvil,
      address: TEST_WALLET_ADDRESS,
      options: { blocks: 2 },
    })

    await stubTradingApiEndpoint({
      page,
      endpoint: uniswapUrls.tradingApiPaths.claimLpFees,
      modifyResponseData: (data) => {
        try {
          data.claim.gasLimit = DEFAULT_TEST_GAS_LIMIT
          return data
        } catch {
          return data
        }
      },
    })
    await page.route(
      `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
      async (route) => {
        await route.fulfill({ path: Mocks.Positions.get_v4_position })
      },
    )
    await page.goto('/positions/v4/ethereum/13298')

    // Perform fee claiming and verify transaction was submitted
    await expectSingleTransaction(async () => {
      await page.getByRole('button', { name: 'Collect fees' }).click()
      await page.getByTestId(TestID.ClaimFees).click()
      await expect(page.getByText('Collecting fees')).toBeVisible()
    })
  })
})
