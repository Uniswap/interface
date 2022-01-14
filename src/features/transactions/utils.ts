import { providers } from 'ethers'
import { SerializableTxReceipt, TransactionStatus } from 'src/features/transactions/types'

export function getSerializableTxReceipt({
  blockHash,
  blockNumber,
  contractAddress,
  from,
  status,
  to,
  transactionHash,
  transactionIndex,
}: providers.TransactionReceipt): SerializableTxReceipt {
  return {
    blockHash,
    blockNumber,
    contractAddress,
    from,
    status: status ? TransactionStatus.Success : TransactionStatus.Failed,
    to,
    transactionHash,
    transactionIndex,
  }
}
