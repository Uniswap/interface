import { providers } from 'ethers'
import { transactionActions } from 'src/features/transactions/slice'
import { TransactionInfo } from 'src/features/transactions/types'
import { getSerializableTxReceipt } from 'src/features/transactions/utils'
import { put } from 'typed-redux-saga'

export function* addTransaction(response: providers.TransactionResponse, info: TransactionInfo) {
  const { chainId, hash, from } = response
  yield* put(transactionActions.addTransaction({ chainId, hash, from, info }))
}

export function* finalizeTransaction(
  response: providers.TransactionResponse,
  receipt: providers.TransactionReceipt
) {
  const { chainId, hash } = response
  yield* put(
    transactionActions.finalizeTransaction({
      chainId,
      hash,
      receipt: getSerializableTxReceipt(receipt),
    })
  )
}
