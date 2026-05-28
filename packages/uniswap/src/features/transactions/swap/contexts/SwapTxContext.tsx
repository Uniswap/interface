import { PropsWithChildren, createContext, useContext, useEffect } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxAndGasInfo as useLegacySwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useSwapTxAndGasInfo'
import { useSwapTxAndGasInfo as useServiceBasedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/hooks'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export const SwapTxContext = createContext<SwapTxAndGasInfo | undefined>(undefined)

function LegacySwapTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useAccountMeta()
  const { derivedSwapInfo } = useSwapFormContext()
  const swapTxContext = useLegacySwapTxAndGasInfo({ derivedSwapInfo, account })
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  useEffect(() => {
    logContextUpdate('SwapTxContext', swapTxContext, datadogEnabled)
  }, [swapTxContext, datadogEnabled])

  return <SwapTxContext.Provider value={swapTxContext}>{children}</SwapTxContext.Provider>
}

function ServiceBasedSwapTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const swapTxContext = useServiceBasedSwapTxAndGasInfo()
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  useEffect(() => {
    logContextUpdate('SwapTxContext', swapTxContext, datadogEnabled)
  }, [swapTxContext, datadogEnabled])

  return <SwapTxContext.Provider value={swapTxContext}>{children}</SwapTxContext.Provider>
}

export function SwapTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const serviceBasedSwapTxAndGasInfoEnabled = useFeatureFlag(FeatureFlags.ServiceBasedSwapTransactionInfo)

  const Provider = serviceBasedSwapTxAndGasInfoEnabled ? ServiceBasedSwapTxContextProvider : LegacySwapTxContextProvider
  return <Provider>{children}</Provider>
}

export const useSwapTxContext = (): SwapTxAndGasInfo => {
  const swapContext = useContext(SwapTxContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapTxContext` must be used inside of `SwapTxContextProvider`')
  }

  return swapContext
}
