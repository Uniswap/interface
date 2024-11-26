import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { DEFAULT_CUSTOM_DEADLINE } from 'uniswap/src/features/transactions/swap/settings/useDeadlineSettings'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export type SwapSettingsState = {
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
  customDeadline?: number
  selectedProtocols: FrontendSupportedProtocol[]
}

type SwapSettingsContextState = {
  updateSwapSettings: (newState: Partial<SwapSettingsState>) => void
} & SwapSettingsState

export const getDefaultState = ({ autoSlippageTolerance }: Partial<SwapSettingsState>): SwapSettingsState => ({
  customDeadline: DEFAULT_CUSTOM_DEADLINE,
  autoSlippageTolerance,
  selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
})

export const SwapSettingsContext = createContext<SwapSettingsContextState | undefined>(undefined)

export function SwapSettingsContextProvider({
  children,
  autoSlippageTolerance,
}: { children: ReactNode } & Partial<SwapSettingsState>): JSX.Element {
  const defaultState = useMemo(() => getDefaultState({ autoSlippageTolerance }), [autoSlippageTolerance])
  const [swapSettings, setSwapSettings] = useState<SwapSettingsState>(defaultState)
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  const updateSwapSettings = useCallback(
    (newState: Parameters<SwapSettingsContextState['updateSwapSettings']>[0]): void => {
      setSwapSettings((prevState) => {
        const updatedState = { ...prevState, ...newState }

        logContextUpdate('SwapSettingsContext', updatedState, datadogEnabled)

        return updatedState
      })
    },
    [setSwapSettings, datadogEnabled],
  )

  const state = useMemo<SwapSettingsContextState>(
    (): SwapSettingsContextState => ({
      autoSlippageTolerance: swapSettings.autoSlippageTolerance,
      customSlippageTolerance: swapSettings.customSlippageTolerance,
      customDeadline: swapSettings.customDeadline,
      selectedProtocols: swapSettings.selectedProtocols,
      updateSwapSettings,
    }),
    [
      swapSettings.customSlippageTolerance,
      swapSettings.customDeadline,
      swapSettings.autoSlippageTolerance,
      swapSettings.selectedProtocols,
      updateSwapSettings,
    ],
  )

  return <SwapSettingsContext.Provider value={state}>{children}</SwapSettingsContext.Provider>
}

export const useSwapSettingsContext = (): SwapSettingsContextState => {
  const swapContext = useContext(SwapSettingsContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapSettingsContext` must be used inside of `SwapSettingsContextProvider`')
  }

  return swapContext
}
