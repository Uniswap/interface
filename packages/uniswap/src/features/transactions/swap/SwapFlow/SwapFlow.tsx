import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionSettingsStoreContext,
  useGetTransactionSettingsContextValue,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/TransactionSettingsStoreContext'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { TransactionModal } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import type { TransactionModalProps } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalProps'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { ActivePlanUpdater } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/ActivePlanUpdater'
import { SwapDependenciesStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContext'
import { useSwapDependenciesStoreBase } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import type { SwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/createSwapFormStore'
import { SwapFormStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { useSwapFormStoreBase } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { SwapTxStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/SwapTxStoreContextProvider'
import { CurrentScreen } from 'uniswap/src/features/transactions/swap/SwapFlow/CurrentScreen'
import { SwapFlowTimer } from 'uniswap/src/features/transactions/swap/utils/SwapFlowTimer'
import { signalSwapModalClosed } from 'uniswap/src/utils/saga'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { useEvent } from 'utilities/src/react/hooks'

export interface SwapFlowProps extends Omit<TransactionModalProps, 'fullscreen' | 'modalName' | 'swapFlowTimer'> {
  prefilledState?: SwapFormState
  settings: TransactionSettingConfig[]
  hideHeader?: boolean
  hideFooter?: boolean
  onSubmitSwap?: () => Promise<void> | void
  tokenColor?: string
}

function useSwapFlowOnClose({
  onClose,
  swapFormStore,
}: {
  onClose: (() => void) | undefined
  swapFormStore: SwapFormStore
}): () => void {
  const dispatch = useDispatch()

  const cleanup = useEvent(() => {
    const isSubmitting = swapFormStore.getState().isSubmitting
    const { activePlan } = activePlanStore.getState()

    if (activePlan) {
      if (isSubmitting) {
        activePlanStore.getState().actions.backgroundPlan(activePlan.planId)
      }
      activePlanStore.getState().actions.resetActivePlan()
    }

    dispatch(signalSwapModalClosed())
  })

  return useEvent(() => {
    cleanup()
    onClose?.()
  })
}

export function SwapFlow({ settings, onSubmitSwap, tokenColor, ...transactionModalProps }: SwapFlowProps): JSX.Element {
  const transactionSettingsContext = useGetTransactionSettingsContextValue()
  const swapDependenciesStore = useSwapDependenciesStoreBase()
  const swapFormStore = useSwapFormStoreBase()
  const closeAndCleanUp = useSwapFlowOnClose({ onClose: transactionModalProps.onClose, swapFormStore })

  const tracker = useMemo(() => new SwapFlowTimer(), [])

  useEffect(() => {
    tracker.mark(DDRumManualTiming.SwapModalOpen)
    return () => tracker.dispose()
  }, [tracker])

  return (
    <TransactionModal
      modalName={ModalName.Swap}
      {...transactionModalProps}
      swapFlowTimer={tracker}
      onClose={closeAndCleanUp}
    >
      {/* Re-create the TransactionSettingsContextProvider, since rendering within a Portal causes its children to be in a separate component tree. */}
      <TransactionSettingsStoreContext.Provider value={transactionSettingsContext}>
        {/* Re-create the SwapFormStoreContextProvider, since rendering within a Portal causes its children to be in a separate component tree. */}
        <SwapFormStoreContext.Provider value={swapFormStore}>
          {/* Re-create the SwapTxStoreContextProvider, since rendering within a Portal causes its children to be in a separate component tree. */}
          <SwapTxStoreContextProvider>
            <SwapDependenciesStoreContext.Provider value={swapDependenciesStore}>
              <ActivePlanUpdater />
              <CurrentScreen settings={settings} tokenColor={tokenColor} onSubmitSwap={onSubmitSwap} />
            </SwapDependenciesStoreContext.Provider>
          </SwapTxStoreContextProvider>
        </SwapFormStoreContext.Provider>
      </TransactionSettingsStoreContext.Provider>
    </TransactionModal>
  )
}
