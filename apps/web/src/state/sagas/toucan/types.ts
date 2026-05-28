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
