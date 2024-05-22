import { SupportedInterfaceChainId } from 'constants/chains'
import { SignatureDetails } from 'state/signatures/types'
import { SerializableTransactionReceipt, TransactionDetails } from '../transactions/types'

interface BaseUpdate<T> {
  type: string
  chainId: SupportedInterfaceChainId
  original: T
  update?: Partial<T>
  receipt?: SerializableTransactionReceipt
}

export interface TransactionUpdate extends BaseUpdate<TransactionDetails> {
  type: 'transaction'
  receipt: SerializableTransactionReceipt
}

interface OrderUpdate extends BaseUpdate<SignatureDetails> {
  type: 'signature'
}

export type ActivityUpdate = TransactionUpdate | OrderUpdate
export type OnActivityUpdate = (update: ActivityUpdate) => void
