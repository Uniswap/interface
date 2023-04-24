import { MaxUint256 } from '@ethersproject/constants'
import { call } from '@redux-saga/core/effects'
import { TradeType } from '@uniswap/sdk-core'
import { MethodParameters } from '@uniswap/v3-sdk'
import { expectSaga } from 'redux-saga-test-plan'
import { getProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { approveAndSwap, SwapParams } from 'src/features/transactions/swap/swapSaga'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { ExactInputSwapTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { account, mockProvider } from 'src/test/fixtures'
import { currencyId } from 'src/utils/currencyId'

const methodParameters: MethodParameters = {
  value: '0x00',
  calldata: '0x01',
}

const CHAIN_ID = ChainId.Goerli
const swapRouterAddress = SWAP_ROUTER_ADDRESSES[CHAIN_ID]

const transactionTypeInfo: ExactInputSwapTransactionInfo = {
  type: TransactionType.Swap,
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyId: currencyId(NativeCurrency.onChain(CHAIN_ID)),
  outputCurrencyId: '0xabc',
  inputCurrencyAmountRaw: '10000',
  expectedOutputCurrencyAmountRaw: '200000',
  minimumOutputCurrencyAmountRaw: '300000',
}

const mockTrade = {
  inputAmount: { currency: new NativeCurrency(CHAIN_ID) },
  quote: { amount: MaxUint256, methodParameters },
} as unknown as Trade

const mockApproveTxRequest = {
  chainId: 1,
  to: DAI.address,
  data: '0x0',
}

const mockSwapTxRequest = {
  chainId: 1,
  to: swapRouterAddress,
  data: '0x0',
}

const swapParams: SwapParams = {
  txId: '1',
  account,
  trade: mockTrade,
  approveTxRequest: mockApproveTxRequest,
  swapTxRequest: mockSwapTxRequest,
}

const swapParamsWithoutApprove: SwapParams = {
  txId: '1',
  account,
  trade: mockTrade,
  approveTxRequest: undefined,
  swapTxRequest: mockSwapTxRequest,
}

const nonce = 1

describe(approveAndSwap, () => {
  it('sends a swap tx', async () => {
    await expectSaga(approveAndSwap, swapParamsWithoutApprove)
      .provide([
        [call(getProvider, mockSwapTxRequest.chainId), mockProvider],
        [
          call(sendTransaction, {
            chainId: mockSwapTxRequest.chainId,
            account: swapParams.account,
            options: { request: mockSwapTxRequest },
            typeInfo: transactionTypeInfo,
          }),
          undefined,
        ],
      ])
      .silentRun()
  })

  it('sends a swap tx with incremented nonce if an approve tx is sent first', async () => {
    await expectSaga(approveAndSwap, swapParams)
      .provide([
        [call(getProvider, mockSwapTxRequest.chainId), mockProvider],
        [
          call(sendTransaction, {
            chainId: mockSwapTxRequest.chainId,
            account: swapParams.account,
            options: { request: mockApproveTxRequest },
            typeInfo: transactionTypeInfo,
          }),
          undefined,
        ],
        [
          call(sendTransaction, {
            chainId: mockTrade.inputAmount.currency.chainId,
            account: swapParams.account,
            options: { request: { ...mockSwapTxRequest, nonce: nonce + 1 } },
            typeInfo: transactionTypeInfo,
          }),
          undefined,
        ],
      ])
      .silentRun()
  })
})
