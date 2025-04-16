import { createContext, useContext } from 'react'
import { GetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'

interface SwapDependenciesContextState {
  derivedSwapInfo: DerivedSwapInfo
  getExecuteSwapService: GetExecuteSwapService
  // this is temp as we work to remove usage of this in code
  wrapCallback: WrapCallback
}

export const SwapDependenciesContext = createContext<SwapDependenciesContextState>(
  null as unknown as SwapDependenciesContextState,
)

export const useSwapDependencies = (): SwapDependenciesContextState => {
  const context = useContext(SwapDependenciesContext)
  if (!context) {
    throw new Error('useSwapDependencies must be used within a SwapDependenciesContext')
  }
  return context
}
