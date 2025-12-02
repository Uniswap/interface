import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { createExpectSingleTransaction } from 'playwright/anvil/transactions'
import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'
import { parseEther } from 'viem'

const test = getTest({ withAnvil: true })

test.describe(
  'Wrap',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe.configure({ retries: 3 })

    test('should unwrap WETH', async ({ page, anvil }) => {
      const expectSingleTransaction = createExpectSingleTransaction({
        anvil,
        address: TEST_WALLET_ADDRESS,
        options: { blocks: 2 },
      })

      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })

      await anvil.setErc20Balance({
        address: assume0xAddress(WETH_ADDRESS(UniverseChainId.Mainnet)),
        balance: parseEther('1'),
      })
      await page.goto(`/swap`)

      await page.getByTestId(TestID.ChooseInputToken).click()
      // eslint-disable-next-line
      await page.getByTestId('token-option-1-WETH').first().click()

      await page.getByTestId(TestID.ChooseOutputToken).click()
      // eslint-disable-next-line
      await page.getByTestId('token-option-1-ETH').first().click()

      await page.getByTestId(TestID.AmountInputIn).fill('0.01')

      await expectSingleTransaction(async () => {
        await page.getByTestId(TestID.ReviewSwap).click()
        await expect(page.getByText('Unwrapped')).toBeVisible()
        await expect(page.getByText('0.010 WETH for 0.010 ETH')).toBeVisible()
      })
    })
    test('should wrap ETH', async ({ page, anvil }) => {
      const expectSingleTransaction = createExpectSingleTransaction({
        anvil,
        address: TEST_WALLET_ADDRESS,
        options: { blocks: 2 },
      })

      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })

      await page.goto(`/swap`)
      await page.getByTestId(TestID.ChooseOutputToken).click()
      // eslint-disable-next-line
      await page.getByTestId('token-option-1-WETH').first().click()

      await page.getByTestId(TestID.AmountInputIn).click()
      await page.getByTestId(TestID.AmountInputIn).fill('0.01')

      await expectSingleTransaction(async () => {
        await page.getByTestId(TestID.ReviewSwap).click()
        await expect(page.getByText('Wrapped')).toBeVisible()
        await expect(page.getByText('0.010 ETH for 0.010 WETH')).toBeVisible()
      })
    })
  },
)
