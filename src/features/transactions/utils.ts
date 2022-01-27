import { providers } from 'ethers'
import { ChainId } from 'src/constants/chains'
import {
  ChainIdToTxIdToDetails,
  TransactionDetails,
  TransactionStatus,
} from 'src/features/transactions/types'
import { getKeys } from 'src/utils/objects'

export function getPendingTransactions(transactions: TransactionDetails[]) {
  return transactions.filter(
    (transaction: TransactionDetails) =>
      Boolean(!transaction.receipt) && transaction.status !== TransactionStatus.Failed
  )
}

export function getTransactionCount(txsByChainId: ChainIdToTxIdToDetails) {
  if (!txsByChainId) return 0
  return getKeys(txsByChainId).reduce<number>((sum, chainId) => {
    sum += Object.keys(txsByChainId[chainId]!).length
    return sum
  }, 0)
}

export function getSerializableTransactionRequest(
  request: providers.TransactionRequest,
  chainId?: ChainId
): providers.TransactionRequest {
  // prettier-ignore
  const { to, from, nonce, gasLimit, gasPrice, data, value, maxPriorityFeePerGas, maxFeePerGas, type } = request
  // Manually restructure the txParams to ensure values going into store are serializable
  return {
    chainId,
    type,
    to,
    from,
    nonce: nonce ? parseInt(nonce.toString(), 10) : undefined,
    gasLimit: gasLimit?.toString(),
    gasPrice: gasPrice?.toString(),
    data: data?.toString(),
    value: value?.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
    maxFeePerGas: maxFeePerGas?.toString(),
  }
}
