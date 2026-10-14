import { MaxUint256, PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { TradingApi, V1_TRADING_API_PATHS } from '@universe/api'
import { areEvmAddressesEqual } from '@universe/chains'
import { TestID } from '@universe/test'
import { USDT } from 'uniswap/src/constants/tokens'
import { assume0xAddress } from '~/chains'
import { ONE_MILLION_USDT } from '~/playwright/anvil/utils'
import { expect, getTest } from '~/playwright/fixtures'
import { EMBEDDED_WALLET_URL_PARAMS, rpcSequence, setupEmbeddedWallet } from '~/playwright/fixtures/embeddedWallet'
import { submitSwapForm } from '~/playwright/fixtures/swapForm'
import { stubTradingApiEndpoint, widenSwapRequestSlippage } from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

// The one flow that runs both signing ceremonies back to back: SignTransaction (approval),
// SignTypedData (permit), SignTransaction (swap). Asserts those seams, not the swap UI matrix.
test.describe(
  'Swap via embedded wallet',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('signs the permit2 approval, permit, and swap through the embedded wallet', async ({ page, anvil }) => {
      const usdtAddress = assume0xAddress(USDT.address)
      const embeddedWallet = await setupEmbeddedWallet(page)
      // Same fork-vs-live drift handling as Swap.anvil.e2e.test.ts.
      await stubTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.swap,
        modifyRequestData: widenSwapRequestSlippage,
      })
      await stubTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.quote,
        modifyRequestData: (data) =>
          data.routingPreference === TradingApi.RoutingPreference.FASTEST
            ? data
            : {
                ...data,
                protocols: [TradingApi.ProtocolItems.V4, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V2],
              },
      })
      await anvil.setErc20Balance({ address: usdtAddress, balance: ONE_MILLION_USDT })
      const initialUsdtBalance = await anvil.getErc20Balance(usdtAddress)

      await page.goto(`/swap?inputCurrency=${USDT.address}&outputCurrency=ETH&${EMBEDDED_WALLET_URL_PARAMS}`)
      await submitSwapForm({ page, amount: '10' })

      const toast = page.getByTestId(TestID.ActivityPopup)
      await expect(toast.getByText('Approved')).toBeVisible({ timeout: 30_000 })
      await expect(toast.getByText('Swapped')).toBeVisible({ timeout: 30_000 })

      const permit2Allowance = await anvil.getErc20Allowance({
        address: usdtAddress,
        spender: PERMIT2_ADDRESS,
        owner: TEST_WALLET_ADDRESS,
      })
      expect(permit2Allowance).toEqual(MaxUint256.toBigInt())
      expect(initialUsdtBalance - (await anvil.getErc20Balance(usdtAddress))).toBe(10_000_000n)

      expect(rpcSequence(embeddedWallet)).toEqual([
        'Challenge:WALLET_SIGNIN',
        'WalletSignIn',
        'Challenge:SIGN_TRANSACTION',
        'SignTransaction',
        'Challenge:SIGN_TYPED_DATA',
        'SignTypedData',
        'Challenge:SIGN_TRANSACTION',
        'SignTransaction',
      ])
      expect(embeddedWallet.signedTransactions).toHaveLength(2)
      expect(embeddedWallet.signedTypedData).toHaveLength(1)
      const permit = embeddedWallet.signedTypedData[0]
      expect(permit.typedData.primaryType).toBe('PermitSingle')
      expect(areEvmAddressesEqual(permit.typedData.domain?.verifyingContract, PERMIT2_ADDRESS)).toBe(true)
      const permitMessage = permit.typedData.message as { details?: { token?: string } }
      expect(areEvmAddressesEqual(permitMessage.details?.token, USDT.address)).toBe(true)
    })
  },
)
