import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import {
  ToucanBidTransactionInfo,
  ToucanWithdrawBidAndClaimTokensTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

export interface SubmitToucanBidParams {
  account: SignerMnemonicAccountDetails
  chainId: number
  txRequest: ValidatedTransactionRequest
  info: ToucanBidTransactionInfo
  setCurrentStep: SetCurrentStepFn
  setSteps?: (steps: TransactionStep[]) => void
  preBidSteps?: TransactionStep[]
  selectChain: (chainId: number) => Promise<boolean>
  onSuccess: (hash: string) => void
  onFailure: (error: Error) => void
  analytics?: Omit<UniverseEventProperties[AuctionEventName.AuctionBidSubmitted], 'transaction_hash'>
  /**
   * Optional callback to run after pre-bid steps complete but before actual bid submission.
   * Used for post-permit2 simulation to validate bid against latest clearing price.
   * If this returns false, the bid submission is aborted and onFailure is called.
   */
  onPreBidStepsComplete?: () => Promise<boolean>
  /**
   * The wallet can send the pre-bid approvals and the bid as one atomic EIP-5792 batch. Callers
   * must check the bid before submitting: a batch has no point between the approvals and the bid
   * at which `onPreBidStepsComplete` could run, so the saga does not batch when that is set.
   */
  canBatchTransactions?: boolean
  /** Turns batching off when the user declines the wallet's account upgrade, so the retry prompts for each step. */
  disableOneClickSwap?: () => void
}

export interface WithdrawBidAndClaimTokensToucanBidParams {
  account: SignerMnemonicAccountDetails
  chainId: number
  txRequest: ValidatedTransactionRequest
  info: ToucanWithdrawBidAndClaimTokensTransactionInfo
  setCurrentStep: SetCurrentStepFn
  selectChain: (chainId: number) => Promise<boolean>
  onSuccess: (hash: string) => void
  onFailure: (error: Error) => void
  analytics?: Omit<UniverseEventProperties[AuctionEventName.AuctionWithdrawSubmitted], 'transaction_hash'>
}
