import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionInfo } from '../transactions/types'

import { SupportedInterfaceChain } from 'constants/chains'
import { SignatureDetails } from 'state/signatures/types'
import { SerializableTransactionReceipt, TransactionDetails } from '../transactions/types'

type TransactionUpdate<T extends TransactionInfo> = {
  type: 'transaction'
  originalTransaction: TransactionDetails & { info: T }
  receipt: SerializableTransactionReceipt
  chainId: SupportedInterfaceChain
  updatedTransactionInfo?: T
}

export type OrderUpdate = {
  type: 'signature'
  updatedStatus: UniswapXOrderStatus
  originalSignature: SignatureDetails
  receipt?: SerializableTransactionReceipt
  chainId: SupportedInterfaceChain
  updatedSwapInfo?: SignatureDetails['swapInfo']
}

export type ActivityUpdate<T extends TransactionInfo> = TransactionUpdate<T> | OrderUpdate
export type OnActivityUpdate = <T extends TransactionInfo>(update: ActivityUpdate<T>) => void
