import { useReportTotalBalancesUsdForAnalytics } from 'appGraphql/data/apollo/useReportTotalBalancesUsdForAnalytics'
import { Currency } from '@uniswap/sdk-core'
import usePrevious from 'hooks/usePrevious'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { CurrencyState, SwapAndLimitContext } from 'state/swap/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { areCurrenciesEqual } from 'uniswap/src/utils/currencyId'

export function SwapAndLimitContextProvider({
  children,
  initialInputCurrency,
  initialOutputCurrency,
}: PropsWithChildren<{
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
}>) {
  const { initialChainId, isUserSelectedToken, setSelectedChainId } = useMultichainContext()
  const [currentTab, setCurrentTab] = useState<SwapTab>(SwapTab.Swap)
  const [currencyState, setCurrencyState] = useState<CurrencyState>({
    inputCurrency: initialInputCurrency,
    outputCurrency: initialOutputCurrency,
  })

  const prefilledState = useMemo(
    () => ({
      inputCurrency: initialInputCurrency,
      outputCurrency: initialOutputCurrency,
    }),
    [initialInputCurrency, initialOutputCurrency],
  )

  const previousInitialInputCurrency = usePrevious(initialInputCurrency)
  const previousInitialOutputCurrency = usePrevious(initialOutputCurrency)
  const previousInitialChainId = usePrevious(initialChainId)
  const { isTestnetModeEnabled } = useEnabledChains()
  const previousIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled)

  useEffect(() => {
    if (
      !areCurrenciesEqual(previousInitialInputCurrency, initialInputCurrency) ||
      !areCurrenciesEqual(previousInitialOutputCurrency, initialOutputCurrency) ||
      previousIsTestnetModeEnabled !== isTestnetModeEnabled
    ) {
      // prefilled state may load in -- i.e. `outputCurrency` URL param pulling from gql
      setCurrencyState(prefilledState)
    }
  }, [
    initialInputCurrency,
    initialOutputCurrency,
    prefilledState,
    previousInitialInputCurrency,
    previousInitialOutputCurrency,
    isTestnetModeEnabled,
    previousIsTestnetModeEnabled,
  ])

  useEffect(() => {
    if (
      !isUserSelectedToken &&
      previousInitialInputCurrency &&
      areCurrenciesEqual(previousInitialInputCurrency, initialInputCurrency)
    ) {
      // if setting initial ETH input chain based on user's balance
      setCurrencyState(prefilledState)
    }
  }, [initialInputCurrency, isUserSelectedToken, prefilledState, previousInitialInputCurrency])

  // biome-ignore lint/correctness/useExhaustiveDependencies: +prefilledState
  useEffect(() => {
    if (!isUserSelectedToken && initialChainId && previousInitialChainId !== initialChainId) {
      setSelectedChainId(initialChainId)
    }
  }, [initialChainId, isUserSelectedToken, prefilledState, previousInitialChainId, setSelectedChainId])

  const value = useMemo(() => {
    return {
      currencyState,
      setCurrencyState,
      currentTab,
      setCurrentTab,
      isSwapAndLimitContext: true,
    }
  }, [currencyState, currentTab])

  useReportTotalBalancesUsdForAnalytics()

  return <SwapAndLimitContext.Provider value={value}>{children}</SwapAndLimitContext.Provider>
}
