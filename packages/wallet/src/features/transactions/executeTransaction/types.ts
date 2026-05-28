import { HexString } from '@universe/encoding'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export interface SignedTransactionRequest {
  request: ValidatedTransactionRequest
  signedRequest: HexString
  timestampBeforeSign: number
}
