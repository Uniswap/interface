import { ChainId, ClaimLPRewardsResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { type SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

export interface LpIncentivesClaimParams {
  account: SignerMnemonicAccountDetails
  chainId: ChainId
  claimData: ClaimLPRewardsResponse
  tokenAddress: string
  setCurrentStep: SetCurrentStepFn
  selectChain: (chainId: number) => Promise<boolean>
  onSuccess: () => void
  onFailure: (error: Error) => void
}
