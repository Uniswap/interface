import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { HexString } from 'uniswap/src/utils/hex'

export interface SignedTransactionRequest {
  request: ValidatedTransactionRequest
  signedRequest: HexString
  timestampBeforeSign: number
}
