import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { DEFAULT_CUSTOM_DEADLINE } from 'uniswap/src/features/transactions/swap/settings/useDeadlineSettings'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export type TransactionSettingsState = {
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
  customDeadline?: number
  selectedProtocols: FrontendSupportedProtocol[]
}

type TransactionSettingsContextState = {
  updateTransactionSettings: (newState: Partial<TransactionSettingsState>) => void
} & TransactionSettingsState

export const getDefaultState = ({
  autoSlippageTolerance,
}: Partial<TransactionSettingsState>): TransactionSettingsState => ({
  customDeadline: DEFAULT_CUSTOM_DEADLINE,
  autoSlippageTolerance,
  selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
})

export const TransactionSettingsContext = createContext<TransactionSettingsContextState | undefined>(undefined)

export function TransactionSettingsContextProvider({
  children,
  autoSlippageTolerance,
}: { children: ReactNode } & Partial<TransactionSettingsState>): JSX.Element {
  const defaultState = useMemo(() => getDefaultState({ autoSlippageTolerance }), [autoSlippageTolerance])
  const [transactionSettings, setTransactionSettings] = useState<TransactionSettingsState>(defaultState)
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  const updateTransactionSettings = useCallback(
    (newState: Parameters<TransactionSettingsContextState['updateTransactionSettings']>[0]): void => {
      setTransactionSettings((prevState) => {
        const updatedState = { ...prevState, ...newState }

        logContextUpdate('TransactionSettingsContext', updatedState, datadogEnabled)

        return updatedState
      })
    },
    [setTransactionSettings, datadogEnabled],
  )

  const state = useMemo<TransactionSettingsContextState>(
    (): TransactionSettingsContextState => ({
      autoSlippageTolerance: transactionSettings.autoSlippageTolerance,
      customSlippageTolerance: transactionSettings.customSlippageTolerance,
      customDeadline: transactionSettings.customDeadline,
      selectedProtocols: transactionSettings.selectedProtocols,
      updateTransactionSettings,
    }),
    [
      transactionSettings.customSlippageTolerance,
      transactionSettings.customDeadline,
      transactionSettings.autoSlippageTolerance,
      transactionSettings.selectedProtocols,
      updateTransactionSettings,
    ],
  )

  return <TransactionSettingsContext.Provider value={state}>{children}</TransactionSettingsContext.Provider>
}

export const useTransactionSettingsContext = (): TransactionSettingsContextState => {
  const swapContext = useContext(TransactionSettingsContext)

  if (swapContext === undefined) {
    throw new Error('`useTransactionSettingsContext` must be used inside of `TransactionSettingsContextProvider`')
  }

  return swapContext
}
