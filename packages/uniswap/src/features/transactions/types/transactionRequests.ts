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

export function sanitizeTransactionRequest(
  request?: TransactionRequest | null,
): ValidatedTransactionRequest | undefined {
  if (!request || !isValidTransactionRequest(request)) {
    return undefined
  }

  const {
    accessList,
    ccipReadEnabled,
    customData,
    data,
    from,
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    to,
    type,
    value,
    chainId,
  } = request

  return {
    to,
    chainId,
    ...(accessList !== undefined ? { accessList } : {}),
    ...(ccipReadEnabled !== undefined ? { ccipReadEnabled } : {}),
    ...(customData !== undefined ? { customData } : {}),
    ...(data !== undefined ? { data } : {}),
    ...(from !== undefined ? { from } : {}),
    ...(gasLimit !== undefined ? { gasLimit } : {}),
    ...(gasPrice !== undefined ? { gasPrice } : {}),
    ...(maxFeePerGas !== undefined ? { maxFeePerGas } : {}),
    ...(maxPriorityFeePerGas !== undefined ? { maxPriorityFeePerGas } : {}),
    ...(nonce !== undefined ? { nonce } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(value !== undefined ? { value } : {}),
  }
}
