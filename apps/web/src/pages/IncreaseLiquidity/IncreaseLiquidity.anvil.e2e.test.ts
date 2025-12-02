import { getPosition } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { ONE_MILLION_USDT } from 'playwright/anvil/utils'
import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { Mocks } from 'playwright/mocks/mocks'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'

const test = getTest({ withAnvil: true })

test.describe(
  'Increase liquidity',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should increase liquidity of a position', async ({ page, anvil }) => {
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.increaseLp })
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.route(
        `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
        async (route) => {
          await route.fulfill({ path: Mocks.Positions.get_v4_position })
        },
      )
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.goto('/positions/v4/ethereum/1')
      await page.getByRole('button', { name: 'Add liquidity' }).dblclick()
      await page.getByTestId(TestID.AmountInputIn).nth(1).click()
      await page.getByTestId(TestID.AmountInputIn).nth(1).fill('1')

      await page.getByRole('button', { name: 'Review' }).click()
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText('Approved')).toBeVisible()
    })

    test.describe('error handling', () => {
      test('should gracefully handle errors during review', async ({ page, anvil }) => {
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.route(
          `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
          async (route) => {
            await route.fulfill({ path: Mocks.Positions.get_v4_position })
          },
        )
        await page.goto('/positions/v4/ethereum/1')
        await page.getByRole('button', { name: 'Add liquidity' }).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).fill('1')

        await page.getByRole('button', { name: 'Review' }).click()
        await page.getByRole('button', { name: 'Confirm' }).click()
        await expect(page.getByText('Approved')).toBeVisible()

        await expect(page.getByText('Something went wrong')).toBeVisible()
        await expect(page.getByText('Insufficient balance for transaction cost')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Review' })).toBeVisible()

        await page.getByTestId(TestID.AmountInputIn).nth(1).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).fill('2')

        await expect(page.getByText('Something went wrong')).not.toBeVisible()
        await expect(page.getByText('Insufficient balance for transaction cost')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Review' })).toBeVisible()
      })

      test('should gracefully handle errors when approved and permit2 is not needed', async ({ page, anvil }) => {
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.route(
          `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
          async (route) => {
            await route.fulfill({ path: Mocks.Positions.get_v4_position })
          },
        )
        await stubTradingApiEndpoint({
          page,
          endpoint: uniswapUrls.tradingApiPaths.lpApproval,
          modifyResponseData: (data) => {
            return { ...data, token1Approval: null, permitData: null }
          },
        })
        await anvil.setErc20Allowance({ address: assume0xAddress(USDT.address), spender: PERMIT2_ADDRESS })

        await page.goto('/positions/v4/ethereum/1')
        await page.getByRole('button', { name: 'Add liquidity' }).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).fill('1')

        await expect(page.getByText('Something went wrong')).toBeVisible()

        await page.getByTestId(TestID.AmountInputIn).nth(1).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).fill('2')

        await expect(page.getByText('Something went wrong')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Review' })).toBeVisible()
      })
    })
  },
)
