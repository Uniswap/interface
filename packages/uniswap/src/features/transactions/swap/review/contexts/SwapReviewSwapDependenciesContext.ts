import { createContext, useContext } from 'react'
import { GetSwapService } from 'uniswap/src/features/transactions/swap/review/services/swapService'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'

interface SwapReviewSwapDepsContextState {
  derivedSwapInfo: DerivedSwapInfo
  swapTxContext: SwapTxAndGasInfo
  getSwapService: GetSwapService
}

export const SwapReviewSwapDepsContext = createContext<SwapReviewSwapDepsContextState>(
  null as unknown as SwapReviewSwapDepsContextState,
)

export const useSwapReviewSwapDependencies = (): SwapReviewSwapDepsContextState => {
  const context = useContext(SwapReviewSwapDepsContext)
  if (!context) {
    throw new Error('useSwapReviewSwapDependencies must be used within a SwapReviewSwapDependenciesContext')
  }
  return context
}
