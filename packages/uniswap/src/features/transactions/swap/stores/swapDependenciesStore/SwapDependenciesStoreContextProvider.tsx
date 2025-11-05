import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useCreateGetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/hooks/useExecuteSwap'
import { createSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/createSwapDependenciesStore'
import { SwapDependenciesStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContext'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { SwapHandlers } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'

interface SwapDependenciesStoreContextProviderProps {
  children: ReactNode
  swapHandlers: SwapHandlers
}

export const SwapDependenciesStoreContextProvider = ({
  children,
  swapHandlers,
}: SwapDependenciesStoreContextProviderProps): JSX.Element => {
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const getExecuteSwapService = useCreateGetExecuteSwapService({
    swapHandlers,
    derivedSwapInfo,
  })

  const derivedState: Parameters<typeof createSwapDependenciesStore>[0] = useMemo(() => {
    return {
      derivedSwapInfo,
      getExecuteSwapService,
      prepareSwapTransaction: swapHandlers.prepareAndSign,
    }
  }, [derivedSwapInfo, getExecuteSwapService, swapHandlers])

  const [store] = useState(() => createSwapDependenciesStore(derivedState))

  const hasDepsChanged = useHasValueChanged(derivedState)

  useEffect(() => {
    if (hasDepsChanged) {
      store.setState(derivedState)
    }
  }, [derivedState, hasDepsChanged, store])

  return <SwapDependenciesStoreContext.Provider value={store}>{children}</SwapDependenciesStoreContext.Provider>
}
