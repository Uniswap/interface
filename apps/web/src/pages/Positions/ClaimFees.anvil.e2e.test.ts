import { getPosition } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_connect'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { createExpectSingleTransaction } from '~/playwright/anvil/transactions'
import { expect, getTest } from '~/playwright/fixtures'
import { stubLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest({ withAnvil: true })

function modifyRequestData(
  data:
    | { v3ClaimLpFeesRequest: { simulateTransaction: boolean } }
    | { v4ClaimLpFeesRequest: { simulateTransaction: boolean } },
) {
  if ('v3ClaimLpFeesRequest' in data) {
    data.v3ClaimLpFeesRequest.simulateTransaction = false
  } else if ('v4ClaimLpFeesRequest' in data) {
    data.v4ClaimLpFeesRequest.simulateTransaction = false
  }
  return data
}

test.describe(
  'Claim fees',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should claim fees from a v3 position', async ({ page, anvil }) => {
      const expectSingleTransaction = createExpectSingleTransaction({
        anvil,
        address: TEST_WALLET_ADDRESS,
        options: { blocks: 2 },
      })

      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.claimLPFees,
        modifyRequestData,
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

      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.claimLPFees,
        modifyRequestData,
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
  },
)
