import { MaxUint256 } from '@ethersproject/constants'
import { call, select } from '@redux-saga/core/effects'
import { Protocol } from '@uniswap/router-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { expectSaga } from 'redux-saga-test-plan'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { DAI } from 'uniswap/src/constants/tokens'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import { SwapParams, approveAndSwap } from 'wallet/src/features/transactions/swap/swapSaga'
import { ClassicTrade } from 'wallet/src/features/transactions/swap/trade/types'
import { ExactInputSwapTransactionInfo, TransactionType } from 'wallet/src/features/transactions/types'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { getTxProvidersMocks } from 'wallet/src/test/mocks'

const account = signerMnemonicAccount()

const CHAIN_ID = UniverseChainId.Mainnet
const universalRouterAddress = UNIVERSAL_ROUTER_ADDRESS(CHAIN_ID)

const { mockProvider } = getTxProvidersMocks()

const transactionTypeInfo: ExactInputSwapTransactionInfo = {
  type: TransactionType.Swap,
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyId: currencyId(NativeCurrency.onChain(CHAIN_ID)),
  outputCurrencyId: '0xabc',
  inputCurrencyAmountRaw: '10000',
  expectedOutputCurrencyAmountRaw: '200000',
  minimumOutputCurrencyAmountRaw: '300000',
  protocol: Protocol.V3,
}

const mockTrade = {
  inputAmount: { currency: new NativeCurrency(CHAIN_ID) },
  quote: { amount: MaxUint256 },
} as unknown as ClassicTrade

const mockApproveTxRequest = {
  chainId: 1,
  to: DAI.address,
  data: '0x0',
}

const mockSwapTxRequest = {
  chainId: 1,
  to: universalRouterAddress,
  data: '0x0',
}

const swapParams: SwapParams = {
  txId: '1',
  account,
  analytics: {} as ReturnType<typeof getBaseTradeAnalyticsProperties>,
  swapTxContext: {
    routing: Routing.CLASSIC,
    approveTxRequest: mockApproveTxRequest,
    txRequest: mockSwapTxRequest,
    trade: mockTrade,
    gasFee: { value: '5', loading: false, error: undefined },
    approvalError: false,
  },
  onSubmit: jest.fn(),
  onFailure: jest.fn(),
}

const swapParamsWithoutApprove: SwapParams = {
  ...swapParams,
  swapTxContext: {
    ...swapParams.swapTxContext,
    approveTxRequest: undefined,
  },
}

const nonce = 1

// TODO(WEB-4294): The saga runs in these tests are not actually finishing as `getNonceForApproveAndSwap` fails; update to work correctly
describe(approveAndSwap, () => {
  const sharedProviders: (EffectProviders | StaticProvider)[] = [
    [select(selectWalletSwapProtectionSetting), SwapProtectionSetting.Off],
    [call(getProvider, mockSwapTxRequest.chainId), mockProvider],
    [
      call(sendTransaction, {
        chainId: mockSwapTxRequest.chainId,
        account: swapParams.account,
        options: { request: mockApproveTxRequest },
        typeInfo: transactionTypeInfo,
        analytics: swapParams.analytics,
      }),
      undefined,
    ],
  ]

  it('sends a swap tx', async () => {
    await expectSaga(approveAndSwap, swapParamsWithoutApprove).provide(sharedProviders).silentRun()
  })

  it('sends a swap tx with incremented nonce if an approve tx is sent first', async () => {
    await expectSaga(approveAndSwap, swapParams)
      .provide([
        ...sharedProviders,
        [
          call(sendTransaction, {
            chainId: mockTrade.inputAmount.currency.chainId,
            account: swapParams.account,
            options: {
              request: { ...mockSwapTxRequest, nonce: nonce + 1 },
            },
            typeInfo: transactionTypeInfo,
            analytics: swapParams.analytics,
          }),
          undefined,
        ],
      ])
      .silentRun()
  })
})
