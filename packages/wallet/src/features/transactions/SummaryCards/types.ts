import { TransactionState } from 'uniswap/src/features/transactions/transactionState/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import { TransactionDetails } from 'wallet/src/features/transactions/types'

export interface TransactionSummaryLayoutProps {
  authTrigger?: AuthTrigger
  transaction: TransactionDetails
  title?: string
  caption: string
  postCaptionElement?: JSX.Element
  icon?: JSX.Element
  index?: number
  onRetry?: () => void
}

export interface SummaryItemProps {
  authTrigger?: AuthTrigger
  transaction: TransactionDetails
  layoutElement: React.FunctionComponent<TransactionSummaryLayoutProps>
  swapCallbacks?: SwapSummaryCallbacks
  index?: number
}

export interface SwapSummaryCallbacks {
  useLatestSwapTransaction: (address: string) => TransactionDetails | undefined
  useSwapFormTransactionState: (
    address: Address | undefined,
    chainId: WalletChainId | undefined,
    txId: string | undefined,
  ) => TransactionState | undefined
  onRetryGenerator?: (swapFormState: TransactionState | undefined) => () => void
}
