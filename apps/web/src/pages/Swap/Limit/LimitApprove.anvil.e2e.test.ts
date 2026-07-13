import { MaxUint256, PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { V1_TRADING_API_PATHS } from '@universe/api'
import { USDT } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { parseEther } from '~/chains'
import { expect, getTest } from '~/playwright/fixtures'
import { stubTradingApiEndpoint } from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { assume0xAddress } from '~/utils/wagmi'

const test = getTest({ withAnvil: true })

// A limit order on an ERC20 input requires a one-time ERC20 -> Permit2
// approval before the order can be signed. Seeds an ERC20 (USDT) input.
test.describe(
  'Limit order token approval',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe.configure({ retries: 3 })

    test('approves USDT to Permit2 as the first step of a limit order', async ({ page, anvil }) => {
      const usdtAddress = assume0xAddress(USDT.address)
      const permit2Allowance = () =>
        anvil.getErc20Allowance({ address: usdtAddress, spender: PERMIT2_ADDRESS, owner: TEST_WALLET_ADDRESS })

      await stubTradingApiEndpoint({ page, endpoint: V1_TRADING_API_PATHS.quote })
      // Native ETH funds approval tx gas; USDT is token being sold/approved.
      await anvil.setBalance({ address: TEST_WALLET_ADDRESS, value: parseEther('10') })
      await anvil.setErc20Balance({ address: usdtAddress, balance: 1_000_000_000n }) // 1,000 USDT
      await page.goto(`/limit?inputCurrency=${USDT.address}&outputCurrency=ETH`)
      await page.getByTestId(TestID.AmountInputIn).fill('100')
      // Limit price must be set for trade to exist
      await page.getByText('+1%').click()

      // Test wallet has not approved USDT to Permit2 yet.
      expect(await permit2Allowance()).toEqual(0n)

      await page.getByTestId(TestID.SubmitOrderButton).click()
      // The approval tx is sent fee-less; pin ample base fee
      const FORK_BASE_FEE = 100_000_000_000n // 100 gwei
      await anvil.setNextBlockBaseFeePerGas({ baseFeePerGas: FORK_BASE_FEE })
      await page.getByTestId(TestID.ConfirmSwapButton).click()

      // Anvil auto-mines each tx, so poll only to await the async submission.
      await expect.poll(permit2Allowance, { timeout: 30_000 }).toEqual(MaxUint256.toBigInt())
    })
  },
)
