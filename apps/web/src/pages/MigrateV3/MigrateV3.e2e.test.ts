import { getPosition } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { expect, getTest } from 'playwright/fixtures'
import { Mocks } from 'playwright/mocks/mocks'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe('Migrate V3', () => {
  test.describe('error handling', () => {
    test('should gracefully handle errors during review', async ({ page }) => {
      await page.route(
        `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
        async (route) => {
          await route.fulfill({ path: Mocks.Positions.get_v3_position })
        },
      )
      await page.goto('/migrate/v3/ethereum/1035132')
      await page.getByRole('button', { name: 'Continue', disabled: false }).first().click()
      await page.getByRole('button', { name: 'Continue', disabled: false }).first().click()
      await page.getByRole('button', { name: 'Migrate' }).click()
      await expect(page.getByText('Something went wrong')).toBeVisible()
      await expect(page.getByText('There was an error fetching data required for your transaction.')).toBeVisible()
      await page.getByTestId(TestID.LiquidityModalHeaderClose).click()
      await page.getByRole('button', { name: 'Continue', disabled: false }).first().click()
      await expect(page.getByText('Something went wrong')).not.toBeVisible()
    })
  })
})
