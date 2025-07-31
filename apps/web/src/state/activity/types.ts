import { FilledUniswapXOrderDetails, SignatureDetails, UnfilledUniswapXOrderDetails } from 'state/signatures/types'
import { ConfirmedTransactionDetails, TransactionDetails } from 'state/transactions/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface BaseUpdate<T> {
  type: string
  chainId: UniverseChainId
  original: T
  update: Partial<T>
}

interface TransactionUpdate extends BaseUpdate<TransactionDetails> {
  type: 'transaction'
  update: Required<Pick<ConfirmedTransactionDetails, 'status' | 'typeInfo'>> & { hash?: string }
}

export interface OrderUpdate extends BaseUpdate<SignatureDetails> {
  type: 'signature'
  update:
    | Pick<UnfilledUniswapXOrderDetails, 'swapInfo' | 'status'>
    | Pick<FilledUniswapXOrderDetails, 'swapInfo' | 'status' | 'txHash'>
}

export type ActivityUpdate = TransactionUpdate | OrderUpdate
export type OnActivityUpdate = (update: ActivityUpdate) => void
