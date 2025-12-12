import { TradingApi } from '@universe/api'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { type SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

export interface LpIncentivesClaimParams {
  account: SignerMnemonicAccountDetails
  chainId: TradingApi.ChainId
  claimData: TradingApi.ClaimLPRewardsResponse
  tokenAddress: string
  setCurrentStep: SetCurrentStepFn
  selectChain: (chainId: number) => Promise<boolean>
  onSuccess: () => void
  onFailure: (error: Error) => void
}
