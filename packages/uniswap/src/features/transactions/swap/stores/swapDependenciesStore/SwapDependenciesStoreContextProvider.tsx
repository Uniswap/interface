import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useCreateGetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/hooks/useExecuteSwap'
import { SwapDependenciesStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContext'
import { createSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/createSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type { SwapHandlers } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import type { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'

interface SwapDependenciesStoreContextProviderProps {
  children: ReactNode
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
  swapHandlers?: SwapHandlers
}

export const SwapDependenciesStoreContextProvider = ({
  children,
  swapCallback,
  wrapCallback,
  swapHandlers,
}: SwapDependenciesStoreContextProviderProps): JSX.Element => {
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const getExecuteSwapService = useCreateGetExecuteSwapService({
    swapCallback,
    wrapCallback,
    swapHandlers,
    derivedSwapInfo,
  })

  const derivedState: Parameters<typeof createSwapDependenciesStore>[0] = useMemo(() => {
    return {
      derivedSwapInfo,
      getExecuteSwapService,
      prepareSwapTransaction: swapHandlers?.prepareAndSign,
      wrapCallback,
    }
  }, [derivedSwapInfo, getExecuteSwapService, swapHandlers, wrapCallback])

  const [store] = useState(() => createSwapDependenciesStore(derivedState))

  const hasDepsChanged = useHasValueChanged(derivedState)

  useEffect(() => {
    if (hasDepsChanged) {
      store.setState(derivedState)
    }
  }, [derivedState, hasDepsChanged, store])

  return <SwapDependenciesStoreContext.Provider value={store}>{children}</SwapDependenciesStoreContext.Provider>
}
