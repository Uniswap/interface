import { TradeType } from '@uniswap/sdk-core'
import { MethodParameters } from '@uniswap/v3-sdk'
import { testSaga } from 'redux-saga-test-plan'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { maybeApprove } from 'src/features/approve/approveSaga'
import { approveAndSwap, SwapParams } from 'src/features/swap/swapSaga'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { ExactInputSwapTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { account, tokenContract } from 'src/test/fixtures'
import { currencyId } from 'src/utils/currencyId'

const methodParameters: MethodParameters = {
  value: '0x00',
  calldata: '0x01',
}

const CHAIN_ID = ChainId.RINKEBY

const transactionTypeInfo: ExactInputSwapTransactionInfo = {
  type: TransactionType.SWAP,
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyId: currencyId(NativeCurrency.onChain(CHAIN_ID)),
  outputCurrencyId: '0xabc',
  inputCurrencyAmountRaw: '10000',
  expectedOutputCurrencyAmountRaw: '200000',
  minimumOutputCurrencyAmountRaw: '300000',
}

const swapParams: SwapParams = {
  account,
  chainId: ChainId.RINKEBY,
  contract: tokenContract,
  methodParameters,
  swapRouterAddress: SWAP_ROUTER_ADDRESSES[CHAIN_ID],
  typeInfo: transactionTypeInfo,
  txAmount: '1',
}

const approveParams = (({
  account: swapAccount,
  chainId,
  contract,
  swapRouterAddress,
  txAmount,
}: SwapParams) => ({
  account: swapAccount,
  chainId,
  contract,
  spender: swapRouterAddress,
  txAmount,
}))(swapParams)

const transaction = {
  from: account.address,
  to: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
  data: '0x01',
}
const transactionWithValue = {
  ...transaction,
  value: '0x02',
}

describe(approveAndSwap, () => {
  it('errors out when approval fails', () => {
    testSaga(approveAndSwap, swapParams)
      .next()
      .call(maybeApprove, approveParams)
      .next(/*approved=*/ false)
      .isDone()
  })

  it('sends a transaction and waits on receipt', () => {
    testSaga(approveAndSwap, swapParams)
      .next()
      .call(maybeApprove, approveParams)
      .next(/*approved=*/ true)
      .call(sendTransaction, {
        chainId: approveParams.chainId,
        account: approveParams.account,
        typeInfo: transactionTypeInfo,
        options: { request: transaction, fetchBalanceOnSuccess: true },
      })
      .next()
      .isDone()
  })

  it('sends a transaction with value and waits on receipt', () => {
    const params = { ...swapParams, methodParameters: { value: '0x02', calldata: '0x01' } }
    testSaga(approveAndSwap, params)
      .next()
      .call(maybeApprove, approveParams)
      .next(/*approved=*/ true)
      .call(sendTransaction, {
        chainId: approveParams.chainId,
        account: approveParams.account,
        typeInfo: transactionTypeInfo,
        options: { request: transactionWithValue, fetchBalanceOnSuccess: true },
      })
      .next()
      .isDone()
  })

  it('skips approval for native currencies', () => {
    const nativeSwapParams: SwapParams = { ...swapParams, contract: null }

    testSaga(approveAndSwap, nativeSwapParams)
      .next()
      .call(sendTransaction, {
        chainId: approveParams.chainId,
        account: approveParams.account,
        typeInfo: transactionTypeInfo,
        options: { request: transaction, fetchBalanceOnSuccess: true },
      })
      .next()
      .isDone()
  })
})
