import { ChainId } from 'wallet/src/constants/chains'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import { TransactionDetails } from 'wallet/src/features/transactions/types'

export interface TransactionSummaryLayoutProps {
  authTrigger?: AuthTrigger
  transaction: TransactionDetails
  title?: string
  caption: string
  postCaptionElement?: JSX.Element
  icon?: JSX.Element
  onRetry?: () => void
}

export interface SummaryItemProps {
  authTrigger?: AuthTrigger
  transaction: TransactionDetails
  layoutElement: React.FunctionComponent<TransactionSummaryLayoutProps>
  swapCallbacks?: SwapSummaryCallbacks
}

export interface SwapSummaryCallbacks {
  useLatestSwapTransaction: (address: string) => TransactionDetails | undefined
  useSwapFormTransactionState: (
    address: Address | undefined,
    chainId: ChainId | undefined,
    txId: string | undefined
  ) => TransactionState | undefined
  onRetryGenerator?: (swapFormState: TransactionState | undefined) => () => void
}
