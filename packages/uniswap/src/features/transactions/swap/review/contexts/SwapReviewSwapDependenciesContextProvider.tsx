import { ReactNode } from 'react'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { SwapReviewSwapDepsContext } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewSwapDependenciesContext'
import { useCreateGetSwapService } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapService'
import { SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'

export const SwapReviewSwapDepsContextProvider = ({
  children,
  swapCallback,
  wrapCallback,
}: {
  children: ReactNode
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}): JSX.Element => {
  const { derivedSwapInfo } = useSwapFormContext()
  const swapTxContext = useSwapTxContext()
  const getSwapService = useCreateGetSwapService({
    swapCallback,
    wrapCallback,
    swapTxContext,
    derivedSwapInfo,
  })
  return (
    <SwapReviewSwapDepsContext.Provider value={{ derivedSwapInfo, swapTxContext, getSwapService }}>
      {children}
    </SwapReviewSwapDepsContext.Provider>
  )
}
