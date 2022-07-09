import { MaxUint256 } from '@ethersproject/constants'
import { MethodParameters } from '@uniswap/v3-sdk'
import { BigNumber, providers } from 'ethers'
import { getProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { maybeApprove } from 'src/features/transactions/approve/approveSaga'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { tradeToTransactionInfo } from 'src/features/transactions/swap/utils'
import { GasSpendEstimate } from 'src/features/transactions/transactionState/transactionState'
import { Account } from 'src/features/wallet/accounts/types'
import { toSupportedChainId } from 'src/utils/chainId'
import { currencyAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export type SwapParams = {
  account: Account
  trade: Trade
  exactApproveRequired: boolean
  methodParameters: MethodParameters
  gasSpendEstimate: GasSpendEstimate
  gasPrice: string
}

export function* approveAndSwap(params: SwapParams) {
  try {
    const {
      account,
      trade,
      exactApproveRequired,
      methodParameters: { calldata, value },
      gasSpendEstimate,
      gasPrice,
    } = params

    const chainId = toSupportedChainId(trade.inputAmount.currency.chainId)
    if (!chainId) throw new Error(`Unsupported chainId: ${chainId}`)

    if (!trade.quote) throw new Error('Trade quote not provided by router endpoint')

    if (!gasSpendEstimate.approve || !gasSpendEstimate.swap) {
      throw new Error('Gas estimates were not provided')
    }

    const inputTokenAddress = currencyAddress(trade.inputAmount.currency)
    const typeInfo = tradeToTransactionInfo(trade)

    const approveAmount = exactApproveRequired ? BigNumber.from(trade.quote.amount) : MaxUint256
    const provider = yield* call(getProvider, chainId)
    const nonce = yield* call([provider, provider.getTransactionCount], account.address)
    const swapRouterAddress = SWAP_ROUTER_ADDRESSES[chainId]

    const approveSubmitted = yield* call(maybeApprove, {
      account,
      chainId,
      inputTokenAddress,
      spender: swapRouterAddress,
      approveAmount,
      gasLimit: gasSpendEstimate.approve,
      gasPrice,
    })

    const request: providers.TransactionRequest = {
      from: account.address,
      to: swapRouterAddress,
      data: calldata,
      ...(!value || isZero(value) ? {} : { value }),
      gasLimit: gasSpendEstimate.swap,
      gasPrice,
      nonce: approveSubmitted ? nonce + 1 : nonce,
    }

    yield* call(sendTransaction, {
      chainId,
      account,
      options: { request },
      typeInfo,
    })
  } catch (e) {
    logger.error('swapSaga', 'approveAndSwap', 'Failed:', e)
  }
}

export const {
  name: swapSagaName,
  wrappedSaga: swapSaga,
  reducer: swapReducer,
  actions: swapActions,
} = createMonitoredSaga<SwapParams>(approveAndSwap, 'swap')
