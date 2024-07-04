import { SupportedInterfaceChainId } from 'constants/chains'
import { FilledUniswapXOrderDetails, SignatureDetails, UnfilledUniswapXOrderDetails } from 'state/signatures/types'
import { ConfirmedTransactionDetails, TransactionDetails } from 'state/transactions/types'

interface BaseUpdate<T> {
  type: string
  chainId: SupportedInterfaceChainId
  original: T
  update: Partial<T>
}

export interface TransactionUpdate extends BaseUpdate<TransactionDetails> {
  type: 'transaction'
  update: Required<Pick<ConfirmedTransactionDetails, 'status' | 'info'>>
}

export interface OrderUpdate extends BaseUpdate<SignatureDetails> {
  type: 'signature'
  update:
    | Pick<UnfilledUniswapXOrderDetails, 'swapInfo' | 'status'>
    | Pick<FilledUniswapXOrderDetails, 'swapInfo' | 'status' | 'txHash'>
}

export type ActivityUpdate = TransactionUpdate | OrderUpdate
export type OnActivityUpdate = (update: ActivityUpdate) => void
