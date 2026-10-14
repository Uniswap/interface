import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { V1_TRADING_API_PATHS } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { assume0xAddress, parseEther } from '~/chains'
import { expect, getTest } from '~/playwright/fixtures'
import { EMBEDDED_WALLET_URL_PARAMS, rpcSequence, setupEmbeddedWallet } from '~/playwright/fixtures/embeddedWallet'
import { submitSwapForm } from '~/playwright/fixtures/swapForm'
import { stubTradingApiEndpoint } from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const WETH = assume0xAddress(WETH_ADDRESS(UniverseChainId.Mainnet))
const WRAP_AMOUNT = parseEther('0.01')

// A single SignTransaction with no permit: the smallest flow the fixture has to carry.
test.describe(
  'Wrap via embedded wallet',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('wraps ETH with one embedded wallet transaction signature', async ({ page, anvil }) => {
      const embeddedWallet = await setupEmbeddedWallet(page)
      await stubTradingApiEndpoint({ page, endpoint: V1_TRADING_API_PATHS.swap })
      const [initialWethBalance, initialEthBalance] = await Promise.all([
        anvil.getErc20Balance(WETH),
        anvil.getBalance({ address: TEST_WALLET_ADDRESS }),
      ])

      await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${WETH}&${EMBEDDED_WALLET_URL_PARAMS}`)
      await submitSwapForm({ page, amount: '0.01' })

      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Wrapped')).toBeVisible()

      expect((await anvil.getErc20Balance(WETH)) - initialWethBalance).toBe(WRAP_AMOUNT)
      expect(await anvil.getBalance({ address: TEST_WALLET_ADDRESS })).toBeLessThan(initialEthBalance - WRAP_AMOUNT)

      expect(rpcSequence(embeddedWallet)).toEqual([
        'Challenge:WALLET_SIGNIN',
        'WalletSignIn',
        'Challenge:SIGN_TRANSACTION',
        'SignTransaction',
      ])
      expect(embeddedWallet.signedTransactions).toHaveLength(1)
      expect(embeddedWallet.signedTypedData).toHaveLength(0)
    })
  },
)
