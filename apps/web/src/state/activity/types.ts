import { ConfirmedTransactionDetails, TransactionDetails } from 'state/transactions/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionType, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export enum ActivityUpdateTransactionType {
  BaseTransaction = 'transaction',
  UniswapXOrder = TransactionType.UniswapXOrder,
}

interface BaseUpdate<T> {
  type: string
  chainId: UniverseChainId
  original: T
  update: Partial<T>
}

interface TransactionUpdate extends BaseUpdate<TransactionDetails> {
  type: ActivityUpdateTransactionType.BaseTransaction
  update: Required<Pick<ConfirmedTransactionDetails, 'status' | 'typeInfo'>> & Partial<ConfirmedTransactionDetails>
}

export interface UniswapXOrderUpdate extends Omit<BaseUpdate<UniswapXOrderDetails>, 'update'> {
  type: ActivityUpdateTransactionType.UniswapXOrder
  update: UniswapXOrderDetails
}

export type ActivityUpdate = TransactionUpdate | UniswapXOrderUpdate
export type OnActivityUpdate = (update: ActivityUpdate) => void
