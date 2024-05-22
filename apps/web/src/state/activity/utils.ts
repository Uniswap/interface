import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { SerializableTransactionReceipt } from 'state/transactions/types'

export function toSerializableReceipt(receipt: TransactionReceipt): SerializableTransactionReceipt {
  return {
    blockHash: receipt.blockHash,
    blockNumber: receipt.blockNumber,
    contractAddress: receipt.contractAddress,
    from: receipt.from,
    status: receipt.status,
    to: receipt.to,
    transactionHash: receipt.transactionHash,
    transactionIndex: receipt.transactionIndex,
  }
}
