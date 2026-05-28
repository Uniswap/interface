import { getPosition } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { ONE_MILLION_USDT } from 'playwright/anvil/utils'
import { expect, test } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { Mocks } from 'playwright/mocks/mocks'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { assume0xAddress } from 'utils/wagmi'

test('should decrease liquidity of a position', async ({ page, anvil }) => {
  await stubTradingApiEndpoint(page, uniswapUrls.tradingApiPaths.decreaseLp)
  await anvil.setErc20Balance(assume0xAddress(USDT.address), ONE_MILLION_USDT)
  await page.route(`${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`, async (route) => {
    await route.fulfill({ path: Mocks.Positions.get_position })
  })
  await anvil.setErc20Balance(assume0xAddress(USDT.address), ONE_MILLION_USDT)
  await page.goto('/positions/v4/ethereum/1')
  await page.getByRole('button', { name: 'Remove liquidity' }).dblclick()
  await page.locator('div').filter({ hasText: /^50%$/ }).click()

  await page.getByRole('button', { name: 'Remove' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByText('1.000 USDT').first()).toBeVisible()
})
