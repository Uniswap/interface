import { TradingApi } from '@universe/api'
import {
  OnChainTransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isBridgeTypeInfo } from 'uniswap/src/features/transactions/types/utils'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { SubmitTransactionParamsWithTypeInfo } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'

export function createUnsubmittedTransactionDetails(
  executeTransactionParams: SubmitTransactionParamsWithTypeInfo,
): OnChainTransactionDetails {
  const { txId, chainId, typeInfo, account, options, transactionOriginType } = executeTransactionParams
  const id = txId ?? createTransactionId()

  const transaction: OnChainTransactionDetails = {
    routing: isBridgeTypeInfo(typeInfo) ? TradingApi.Routing.BRIDGE : TradingApi.Routing.CLASSIC,
    id,
    chainId,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options,
    transactionOriginType,
  }
  return transaction
}
