import { ChainId } from 'wallet/src/constants/chains'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import { TransactionDetails } from 'wallet/src/features/transactions/types'

export interface TransactionSummaryLayoutProps {
  transaction: TransactionDetails
  title?: string
  caption: string
  icon?: JSX.Element
  onRetry?: () => void
}

export interface SummaryItemProps {
  transaction: TransactionDetails
  layoutElement: React.FunctionComponent<TransactionSummaryLayoutProps>
  swapCallbacks?: SwapSummaryCallbacks
}

export interface SwapSummaryCallbacks {
  getLatestSwapTransaction: (address: string) => TransactionDetails | undefined
  getSwapFormTransactionState: (
    address: Address | undefined,
    chainId: ChainId | undefined,
    txId: string | undefined
  ) => TransactionState | undefined
  onRetryGenerator?: (swapFormState: TransactionState | undefined) => () => void
}
