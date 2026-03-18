import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  PlanTransactionDetails,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ConfirmedTransactionDetails, TransactionDetails } from '~/state/transactions/types'

export enum ActivityUpdateTransactionType {
  BaseTransaction = 'transaction',
  UniswapXOrder = TransactionType.UniswapXOrder,
  Plan = TransactionType.Plan,
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

export interface ActivityPlanUpdate extends Omit<BaseUpdate<PlanTransactionDetails>, 'original'> {
  type: ActivityUpdateTransactionType.Plan
  update: PlanTransactionDetails
}

export type ActivityUpdate = TransactionUpdate | UniswapXOrderUpdate | ActivityPlanUpdate
export type OnActivityUpdate<T extends ActivityUpdate = ActivityUpdate> = (update: T) => void
