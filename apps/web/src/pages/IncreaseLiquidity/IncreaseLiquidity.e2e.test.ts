import { getPosition } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { ONE_MILLION_USDT } from 'playwright/anvil/utils'
import { expect, test } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { Mocks } from 'playwright/mocks/mocks'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'

test('should increase liquidity of a position', async ({ page, anvil }) => {
  await stubTradingApiEndpoint(page, uniswapUrls.tradingApiPaths.increaseLp)
  await anvil.setErc20Balance(assume0xAddress(USDT.address), ONE_MILLION_USDT)
  await page.route(`${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`, async (route) => {
    await route.fulfill({ path: Mocks.Positions.get_position })
  })
  await anvil.setErc20Balance(assume0xAddress(USDT.address), ONE_MILLION_USDT)
  await page.goto('/positions/v4/ethereum/1')
  await page.getByRole('button', { name: 'Add liquidity' }).dblclick()
  await page.getByTestId(TestID.AmountInputIn).nth(1).click()
  await page.getByTestId(TestID.AmountInputIn).nth(1).fill('1')

  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByText('Approved')).toBeVisible()
})
