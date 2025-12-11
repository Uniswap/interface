import { TransactionRequest as LiquidityTransactionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { TradingApi } from '@universe/api'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'

export interface LpIncentivesClaimParams {
  address: string
  chainId: TradingApi.ChainId
  claimData: TradingApi.TransactionRequest | LiquidityTransactionRequest
  tokenAddress: string
  setCurrentStep: SetCurrentStepFn
  selectChain: (chainId: number) => Promise<boolean>
  onSuccess: () => void
  onFailure: (error: Error) => void
}
