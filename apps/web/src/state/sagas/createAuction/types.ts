import type { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type { AuctionLaunchTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import type { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

export interface SubmitAuctionLaunchParams {
  account: SignerMnemonicAccountDetails
  selectChain: (chainId: number) => Promise<boolean>
  transactions: ValidatedTransactionRequest[]
  atomicallyBundleable: boolean
  info: AuctionLaunchTransactionInfo
  /** Launch token symbol, used to label the approval step's activity toast (existing-token path). */
  tokenSymbol?: string
  setCurrentStep: SetCurrentStepFn
  onSuccess: (hashOrBatchId: string) => void
  onFailure: (error: Error) => void
}
