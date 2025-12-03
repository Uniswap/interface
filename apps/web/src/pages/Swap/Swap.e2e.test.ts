import { expect, getTest } from 'playwright/fixtures'
import { USDT } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe(
  'Swap',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should default inputs from URL params ', async ({ page }) => {
      await page.goto(`/swap?inputCurrency=${USDT.address}`)
      await expect(page.getByTestId(TestID.ChooseInputToken + '-label')).toHaveText('USDT')

      await page.goto(`/swap?outputCurrency=${USDT.address}`)
      await expect(page.getByTestId(TestID.ChooseOutputToken + '-label')).toHaveText('USDT')

      await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDT.address}`)
      await expect(page.getByTestId(TestID.ChooseInputToken + '-label')).toHaveText('ETH')
      await expect(page.getByTestId(TestID.ChooseOutputToken + '-label')).toHaveText('USDT')
    })

    test('should reset the dependent input when the independent input is cleared', async ({ page }) => {
      await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDT.address}`)
      await page.getByTestId(TestID.AmountInputIn).fill('0.01')
      await page.getByTestId(TestID.AmountInputIn).clear()
      await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue('')
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue('')
    })
  },
)
