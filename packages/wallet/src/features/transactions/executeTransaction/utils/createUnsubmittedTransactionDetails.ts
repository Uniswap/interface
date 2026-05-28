import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import {
  OnChainTransactionDetails,
  TransactionStatus,
  isBridgeTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { ExecuteTransactionParams } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'

export function createUnsubmittedTransactionDetails(
  executeTransactionParams: ExecuteTransactionParams,
): OnChainTransactionDetails {
  const { txId, chainId, typeInfo, account, options, transactionOriginType } = executeTransactionParams
  const id = txId ?? createTransactionId()

  const transaction: OnChainTransactionDetails = {
    routing: isBridgeTypeInfo(typeInfo) ? Routing.BRIDGE : Routing.CLASSIC,
    id,
    chainId,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options: {
      ...options,
    },
    transactionOriginType,
  }
  return transaction
}
