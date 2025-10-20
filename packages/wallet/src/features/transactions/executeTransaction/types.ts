import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { HexString } from 'utilities/src/addresses/hex'

export interface SignedTransactionRequest {
  request: ValidatedTransactionRequest
  signedRequest: HexString
  timestampBeforeSign: number
}
