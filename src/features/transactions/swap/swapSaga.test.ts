import { MaxUint256 } from '@ethersproject/constants'
import { call } from '@redux-saga/core/effects'
import { TradeType } from '@uniswap/sdk-core'
import { MethodParameters } from '@uniswap/v3-sdk'
import { expectSaga } from 'redux-saga-test-plan'
import { getProvider } from 'src/app/walletContext'
import { NATIVE_ADDRESS, SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { ApproveParams, maybeApprove } from 'src/features/transactions/approve/approveSaga'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { approveAndSwap, SwapParams } from 'src/features/transactions/swap/swapSaga'
import { ExactInputSwapTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { account, mockProvider } from 'src/test/fixtures'
import { currencyId } from 'src/utils/currencyId'

const methodParameters: MethodParameters = {
  value: '0x00',
  calldata: '0x01',
}

const CHAIN_ID = ChainId.Rinkeby

const transactionTypeInfo: ExactInputSwapTransactionInfo = {
  type: TransactionType.Swap,
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyId: currencyId(NativeCurrency.onChain(CHAIN_ID)),
  outputCurrencyId: '0xabc',
  inputCurrencyAmountRaw: '10000',
  expectedOutputCurrencyAmountRaw: '200000',
  minimumOutputCurrencyAmountRaw: '300000',
}

const swapParams: SwapParams = {
  account,
  chainId: ChainId.Rinkeby,
  methodParameters,
  swapRouterAddress: SWAP_ROUTER_ADDRESSES[CHAIN_ID],
  typeInfo: transactionTypeInfo,
  inputTokenAddress: NATIVE_ADDRESS,
  approveAmount: MaxUint256,
  gasSpendEstimate: {
    [TransactionType.Approve]: '0',
    [TransactionType.Swap]: '115000',
  },
  gasPrice: '71',
}

const approveParams: ApproveParams = {
  account: swapParams.account,
  chainId: swapParams.chainId,
  approveAmount: MaxUint256,
  inputTokenAddress: swapParams.inputTokenAddress,
  spender: swapParams.swapRouterAddress,
  gasLimit: swapParams.gasSpendEstimate[TransactionType.Approve] as string,
  gasPrice: swapParams.gasPrice,
}

const nonce = 1

const tx = {
  from: swapParams.account.address,
  to: swapParams.swapRouterAddress,
  data: swapParams.methodParameters.calldata,
  gasLimit: swapParams.gasSpendEstimate.swap,
  gasPrice: swapParams.gasPrice,
  nonce,
}

describe(approveAndSwap, () => {
  it('sends a swap tx', async () => {
    await expectSaga(approveAndSwap, swapParams)
      .provide([
        [call(getProvider, approveParams.chainId), mockProvider],
        [call(maybeApprove, approveParams), true],
        [
          call(sendTransaction, {
            chainId: swapParams.chainId,
            account: swapParams.account,
            options: { request: tx },
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
        [call(getProvider, approveParams.chainId), mockProvider],
        [call(maybeApprove, approveParams), true],
        [
          call(sendTransaction, {
            chainId: swapParams.chainId,
            account: swapParams.account,
            options: { request: { ...tx, nonce: nonce + 1 } },
            typeInfo: transactionTypeInfo,
          }),
          undefined,
        ],
      ])
      .silentRun()
  })
})
