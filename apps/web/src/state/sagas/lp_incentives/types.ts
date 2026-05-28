import { ChainId, ClaimLPRewardsResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { type SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'

export interface LpIncentivesClaimParams {
  account: SignerMnemonicAccountMeta
  chainId: ChainId
  claimData: ClaimLPRewardsResponse
  tokenAddress: string
  setCurrentStep: SetCurrentStepFn
  selectChain: (chainId: number) => Promise<boolean>
  onSuccess: () => void
  onFailure: (error: Error) => void
}
