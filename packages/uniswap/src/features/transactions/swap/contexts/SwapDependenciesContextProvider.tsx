import { ReactNode, useMemo } from 'react'
import { SwapDependenciesContext } from 'uniswap/src/features/transactions/swap/contexts/SwapDependenciesContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useCreateGetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/hooks/useExecuteSwap'
import { SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'

export const SwapDependenciesContextProvider = ({
  children,
  swapCallback,
  wrapCallback,
}: {
  children: ReactNode
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}): JSX.Element => {
  const { derivedSwapInfo } = useSwapFormContext()
  const getExecuteSwapService = useCreateGetExecuteSwapService({
    swapCallback,
    wrapCallback,
    derivedSwapInfo,
  })
  const value = useMemo(
    () => ({ derivedSwapInfo, getExecuteSwapService, wrapCallback }),
    [derivedSwapInfo, getExecuteSwapService, wrapCallback],
  )
  return <SwapDependenciesContext.Provider value={value}>{children}</SwapDependenciesContext.Provider>
}
