import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModal } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { TransactionModalProps } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalProps'

import {
  TransactionSettingsContext,
  useTransactionSettingsContext,
} from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { CurrentScreen } from 'uniswap/src/features/transactions/swap/SwapFlow/CurrentScreen'
import {
  SwapDependenciesContext,
  useSwapDependencies,
} from 'uniswap/src/features/transactions/swap/contexts/SwapDependenciesContext'
import {
  SwapFormContext,
  SwapFormState,
  useSwapFormContext,
} from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapTxContextProvider } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'

export interface SwapFlowProps extends Omit<TransactionModalProps, 'fullscreen' | 'modalName'> {
  prefilledState?: SwapFormState
  settings: TransactionSettingConfig[]
  hideHeader?: boolean
  hideFooter?: boolean
  onSubmitSwap?: () => Promise<void> | void
  tokenColor?: string
}

export function SwapFlow({ settings, onSubmitSwap, tokenColor, ...transactionModalProps }: SwapFlowProps): JSX.Element {
  const swapFormContext = useSwapFormContext()
  const transactionSettingsContext = useTransactionSettingsContext()
  const swapDependenciesContext = useSwapDependencies()
  return (
    <TransactionModal modalName={ModalName.Swap} {...transactionModalProps}>
      {/* Re-create the TransactionSettingsContextProvider, since native Modal causes its children to be in a separate component tree. */}
      <TransactionSettingsContext.Provider value={transactionSettingsContext}>
        {/* Re-create the SwapFormContextProvider, since native Modal causes its children to be in a separate component tree. */}
        <SwapFormContext.Provider value={swapFormContext}>
          {/* Re-create the SwapTxContextProviderTradingApi, since native Modal causes its children to be in a separate component tree. */}
          <SwapTxContextProvider>
            {/* Re-create the SwapDependenciesContextProvider, since native Modal causes its children to be in a separate component tree. */}
            <SwapDependenciesContext.Provider value={swapDependenciesContext}>
              <CurrentScreen settings={settings} tokenColor={tokenColor} onSubmitSwap={onSubmitSwap} />
            </SwapDependenciesContext.Provider>
          </SwapTxContextProvider>
        </SwapFormContext.Provider>
      </TransactionSettingsContext.Provider>
    </TransactionModal>
  )
}
