import { MaxUint256 } from '@ethersproject/constants'
import { call } from '@redux-saga/core/effects'
import { TradeType } from '@uniswap/sdk-core'
import { MethodParameters } from '@uniswap/v3-sdk'
import { expectSaga } from 'redux-saga-test-plan'
import { getProvider } from 'src/app/walletContext'
import { NATIVE_ADDRESS, SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { FeeType } from 'src/features/gas/types'
import { getTxGasSettings } from 'src/features/gas/utils'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { ApproveParams, maybeApprove } from 'src/features/transactions/approve/approveSaga'
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

const CHAIN_ID = ChainId.Rinkeby
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
  quote: { amount: MaxUint256 },
} as unknown as Trade

const swapParams: SwapParams = {
  txId: '1',
  account,
  trade: mockTrade,
  exactApproveRequired: false,
  methodParameters,
  gasFeeEstimate: {
    [TransactionType.Approve]: null,
    [TransactionType.Swap]: {
      type: FeeType.Eip1559,
      gasLimit: '100000',
      fee: {
        fast: '14508243138800000',
        normal: '14375759517700000',
        urgent: '14639580260700000',
      },
      feeDetails: {
        currentBaseFeePerGas: '120281423397',
        maxBaseFeePerGas: '142082431388',
        maxPriorityFeePerGas: {
          fast: '3000000000',
          normal: '1675163789',
          urgent: '4313371219',
        },
      },
    },
  },
}

const approveParams: ApproveParams = {
  account: swapParams.account,
  chainId: mockTrade.inputAmount.currency.chainId,
  approveAmount: MaxUint256,
  inputTokenAddress: NATIVE_ADDRESS,
  spender: swapRouterAddress,
  gasFeeEstimate: {
    type: FeeType.Eip1559,
    gasLimit: '100000',
    fee: {
      fast: '14508243138800000',
      normal: '14375759517700000',
      urgent: '14639580260700000',
    },
    feeDetails: {
      currentBaseFeePerGas: '120281423397',
      maxBaseFeePerGas: '142082431388',
      maxPriorityFeePerGas: {
        fast: '3000000000',
        normal: '1675163789',
        urgent: '4313371219',
      },
    },
  },
}

const nonce = 1

describe(approveAndSwap, () => {
  const swapGasEstimate = swapParams.gasFeeEstimate[TransactionType.Swap]
  if (!swapGasEstimate) return
  const gasSettings = getTxGasSettings(swapGasEstimate)
  const tx = {
    from: swapParams.account.address,
    to: swapRouterAddress,
    data: swapParams.methodParameters.calldata,
    nonce,
    ...gasSettings,
  }

  it('sends a swap tx', async () => {
    await expectSaga(approveAndSwap, swapParams)
      .provide([
        [call(getProvider, approveParams.chainId), mockProvider],
        [call(maybeApprove, approveParams), true],
        [
          call(sendTransaction, {
            chainId: mockTrade.inputAmount.currency.chainId,
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
            chainId: mockTrade.inputAmount.currency.chainId,
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
