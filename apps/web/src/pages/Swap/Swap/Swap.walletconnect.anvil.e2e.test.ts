import { V1_TRADING_API_PATHS } from '@universe/api'
import { USDT } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress, parseEther } from '~/chains'
import { expect, getTest } from '~/playwright/fixtures'
import { mockTradingApiEndpoint, mockTradingApiSwapsStatus } from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

// Stage 1 of INFRA-2736: prove a swap works when the wallet is connected via the REAL
// interfaceWalletConnect connector over a hermetic in-process relay + Node counterparty
// (see src/playwright/wc/*). This exercises the exact transport path that regressed in
// INC-316 — the paired wallet's eth_sendTransaction response must return over the relay for
// the swap to leave "Confirm in wallet" and reach the "Swapped" activity state.
//
// Everything runs offline: local relay + counterparty + anvil + static Trading API fixtures
// (no live Trading API egress).
const test = getTest({ withAnvil: true, withWalletConnect: true })

test.describe(
  'Swap via WalletConnect',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should swap ETH to USDT over a WalletConnect session', async ({ page, anvil, walletConnect }) => {
      await mockTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.quote,
        mockPath: Mocks.TradingApi.quote_eth_usdt,
      })
      await mockTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.approval,
        mockPath: Mocks.TradingApi.check_approval_none,
      })
      await mockTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.swap,
        mockPath: Mocks.TradingApi.swap_eth_usdt,
      })
      await mockTradingApiSwapsStatus({ page })
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: 100_000_000n })

      // ?wcConnect=true drives the real WalletConnect connector; the fixture pairs the
      // counterparty with the interface's display_uri and settles the session. Currencies are
      // preset via the URL (like the permit2 anvil specs) to avoid the token-search backend.
      await page.goto(`/swap?wcConnect=true&inputCurrency=ETH&outputCurrency=${USDT.address}`)
      await walletConnect.connect(page)

      await page.getByTestId(TestID.AmountInputIn).click()
      await page.getByTestId(TestID.AmountInputIn).fill('.1')
      await page.getByTestId(TestID.ReviewSwap).click()
      await page.getByTestId(TestID.Swap).click()

      // The counterparty answered eth_sendTransaction and the confirmation propagated back
      // over the relay — i.e. NOT stuck at "Confirm in wallet".
      const toast = page.getByTestId(TestID.ActivityPopup)
      await expect(toast.getByText('Swapped')).toBeVisible()

      // Authoritative on-chain check (read directly from anvil, not the balance UI): the relayed
      // transaction actually executed and debited the test wallet's ETH.
      const ethBalance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
      await expect(ethBalance).toBeLessThan(parseEther('9999.9'))
    })
  },
)
