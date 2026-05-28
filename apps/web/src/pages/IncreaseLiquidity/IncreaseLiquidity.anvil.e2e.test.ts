import { getPosition } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_MILLION_USDT } from '~/playwright/anvil/utils'
import { expect, getTest } from '~/playwright/fixtures'
import { stubLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'
import { Mocks } from '~/playwright/mocks/mocks'
import { assume0xAddress } from '~/utils/wagmi'

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
      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.increasePosition,
        service: LiquidityService,
      })
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
      await expect(page.getByText('Approved').first()).toBeVisible()
    })

    test.describe('approval flow', () => {
      test('should approve and increase liquidity on a V4 position', async ({ page, anvil }) => {
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.increasePosition,
          service: LiquidityService,
        })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.route(
          `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
          async (route) => {
            await route.fulfill({ path: Mocks.Positions.get_v4_position })
          },
        )

        await page.goto('/positions/v4/ethereum/1')
        await page.getByRole('button', { name: 'Add liquidity' }).dblclick()
        await page.getByTestId(TestID.AmountInputIn).nth(1).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).fill('1')

        await page.getByRole('button', { name: 'Review' }).click()
        await page.getByRole('button', { name: 'Confirm' }).click()
        await expect(page.getByText('Approved').first()).toBeVisible()
      })

      test('should approve and increase liquidity on a V3 position', async ({ page, anvil }) => {
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.increasePosition,
          service: LiquidityService,
        })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.route(
          `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
          async (route) => {
            await route.fulfill({ path: Mocks.Positions.get_v3_position })
          },
        )

        await page.goto('/positions/v3/ethereum/1028438')
        await page.getByRole('button', { name: 'Add liquidity' }).dblclick()
        await page.getByTestId(TestID.AmountInputIn).nth(1).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).fill('1')

        await page.getByRole('button', { name: 'Review' }).click()
        await page.getByRole('button', { name: 'Confirm' }).click()
        await expect(page.getByText('Approved').first()).toBeVisible()
      })

      test('should skip permit2 approval when allowance already set', async ({ page, anvil }) => {
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.increasePosition,
          service: LiquidityService,
        })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.route(
          `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
          async (route) => {
            await route.fulfill({ path: Mocks.Positions.get_v4_position })
          },
        )
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.checkLPApproval,
          service: LiquidityService,
          modifyResponseData: (data) => {
            return { ...data, transactions: [], v4BatchPermitData: null }
          },
        })
        await anvil.setErc20Allowance({ address: assume0xAddress(USDT.address), spender: PERMIT2_ADDRESS })

        await page.goto('/positions/v4/ethereum/1')
        await page.getByRole('button', { name: 'Add liquidity' }).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).fill('1')

        await page.getByRole('button', { name: 'Review' }).click()
        await expect(page.getByText('Approval required')).not.toBeVisible()
        await expect(page.getByText('Signature required')).not.toBeVisible()
        await page.getByRole('button', { name: 'Confirm' }).click()
      })
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
        await expect(page.getByText('Approved').first()).toBeVisible()

        await expect(page.getByText('Something went wrong')).toBeVisible()
        await expect(page.getByText('Request failed')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Review' })).toBeVisible()

        await page.getByTestId(TestID.AmountInputIn).nth(1).click()
        await page.getByTestId(TestID.AmountInputIn).nth(1).fill('2')

        await expect(page.getByText('Something went wrong')).not.toBeVisible()
        await expect(page.getByText('Request failed')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Review' })).toBeVisible()
      })
    })
  },
)
