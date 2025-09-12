import { TransactionRequest } from '@ethersproject/providers'
import { NonEmptyArray } from 'utilities/src/primitives/array'

export type PopulatedTransactionRequestArray = NonEmptyArray<ValidatedTransactionRequest>
export type ValidatedTransactionRequest = TransactionRequest & { to: string; chainId: number }

export function isValidTransactionRequest(request: TransactionRequest): request is ValidatedTransactionRequest {
  return (
    typeof request.to === 'string' &&
    request.to.length > 0 &&
    typeof request.chainId === 'number' &&
    request.chainId > 0
  )
}
