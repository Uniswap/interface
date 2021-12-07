import { providers } from 'ethers'
import { transactionActions } from 'src/features/transactions/slice'
import { TransactionInfo } from 'src/features/transactions/types'
import { put } from 'typed-redux-saga'

export function* addTransaction(response: providers.TransactionResponse, info: TransactionInfo) {
  const { chainId, hash, from } = response
  yield* put(transactionActions.addTransaction({ chainId, hash, from, info }))
}

const serializeTransactionReceipt = ({
  blockHash,
  blockNumber,
  contractAddress,
  from,
  status,
  to,
  transactionHash,
  transactionIndex,
}: providers.TransactionReceipt) => ({
  blockHash,
  blockNumber,
  contractAddress,
  from,
  status,
  to,
  transactionHash,
  transactionIndex,
})

export function* finalizeTransaction(
  response: providers.TransactionResponse,
  receipt: providers.TransactionReceipt
) {
  const { chainId, hash } = response
  yield* put(
    transactionActions.finalizeTransaction({
      chainId,
      hash,
      receipt: serializeTransactionReceipt(receipt),
    })
  )
}
