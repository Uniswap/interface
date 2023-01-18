import { providers } from 'ethers'
import { getProvider } from 'src/app/walletContext'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { tradeToTransactionInfo } from 'src/features/transactions/swap/utils'
import { TransactionType, TransactionTypeInfo } from 'src/features/transactions/types'
import { Account } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export type SwapParams = {
  txId?: string
  account: Account
  trade: Trade
  approveTxRequest?: providers.TransactionRequest
  swapTxRequest: providers.TransactionRequest
}

// TODO(MOB-3857): Add more specific return type
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function* approveAndSwap(params: SwapParams) {
  try {
    const { account, approveTxRequest, swapTxRequest, txId, trade } = params
    if (!swapTxRequest.chainId || !swapTxRequest.to || (approveTxRequest && !approveTxRequest.to)) {
      throw new Error('approveAndSwap received incomplete transaction request details')
    }

    const { chainId } = swapTxRequest
    const provider = yield* call(getProvider, chainId)
    const nonce = yield* call([provider, provider.getTransactionCount], account.address, 'pending')

    if (approveTxRequest && approveTxRequest.to) {
      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Approve,
        tokenAddress: approveTxRequest.to,
        spender: swapTxRequest.to,
      }

      yield* call(sendTransaction, {
        chainId,
        account,
        options: { request: approveTxRequest },
        typeInfo,
        trade,
      })
    }

    const request = {
      ...swapTxRequest,
      nonce: approveTxRequest ? nonce + 1 : undefined,
    }

    const swapTypeInfo = tradeToTransactionInfo(trade)
    yield* call(sendTransaction, {
      txId,
      chainId,
      account,
      options: { request },
      typeInfo: swapTypeInfo,
      trade,
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
