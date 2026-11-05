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


/**
 * EIP-1474 QUANTITY encoding: hex with no leading zeros (except `0x0`).
 * Some RPCs (e.g. Go hexutil.Big on Robinhood Chain) reject padded values like
 * `0x033f…` from the Trading API, which blocks gas estimation and signing.
 */
function canonicalizeQuantityHex(value: TransactionRequest['value']): TransactionRequest['value'] {
  if (typeof value !== 'string') {
    return value
  }
  const trimmed = value.trim()
  if (!/^0x[0-9a-fA-F]*$/i.test(trimmed)) {
    return value
  }
  const body = trimmed.slice(2).replace(/^0+/, '')
  return `0x${body.length === 0 ? '0' : body.toLowerCase()}`
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
    ...(value !== undefined ? { value: canonicalizeQuantityHex(value) } : {}),
  }
}
