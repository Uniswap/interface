import { Currency } from '@uniswap/sdk-core'
import { useReportTotalBalancesUsdForAnalytics } from 'graphql/data/apollo/useReportTotalBalancesUsdForAnalytics'
import { useAccount } from 'hooks/useAccount'
import usePrevious from 'hooks/usePrevious'
import { useUpdateAtom } from 'jotai/utils'
import { multicallUpdaterSwapChainIdAtom } from 'lib/hooks/useBlockNumber'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import { CurrencyState, SwapAndLimitContext, SwapContext, SwapState, initialSwapState } from 'state/swap/types'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { areCurrenciesEqual } from 'uniswap/src/utils/currencyId'

export function SwapAndLimitContextProvider({
  children,
  initialChainId,
  initialInputCurrency,
  initialOutputCurrency,
  multichainUXEnabled,
}: PropsWithChildren<{
  initialChainId?: UniverseChainId
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  multichainUXEnabled?: boolean
}>) {
  const [selectedChainId, setSelectedChainId] = useState<UniverseChainId | undefined | null>(initialChainId)
  const [isUserSelectedToken, setIsUserSelectedToken] = useState<boolean>(false)
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

  const account = useAccount()
  const previousInitialInputCurrency = usePrevious(initialInputCurrency)
  const previousInitialOutputCurrency = usePrevious(initialOutputCurrency)
  const previousInitialChainId = usePrevious(initialChainId)

  useEffect(() => {
    if (
      !areCurrenciesEqual(previousInitialInputCurrency, initialInputCurrency) ||
      !areCurrenciesEqual(previousInitialOutputCurrency, initialOutputCurrency)
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
  ])

  useEffect(() => {
    if (
      multichainUXEnabled &&
      !isUserSelectedToken &&
      previousInitialInputCurrency &&
      areCurrenciesEqual(previousInitialInputCurrency, initialInputCurrency)
    ) {
      // if setting initial ETH input chain based on user's balance
      setCurrencyState(prefilledState)
    }
  }, [initialInputCurrency, isUserSelectedToken, multichainUXEnabled, prefilledState, previousInitialInputCurrency])

  useEffect(() => {
    if (!isUserSelectedToken && initialChainId && previousInitialChainId !== initialChainId) {
      setSelectedChainId(initialChainId)
      if (!multichainUXEnabled) {
        // if user hasn't manually selected tokens, reset back to prefilled state when chain changes
        setCurrencyState(prefilledState)
      }
    }
  }, [
    initialChainId,
    isUserSelectedToken,
    multichainUXEnabled,
    prefilledState,
    previousInitialChainId,
    setSelectedChainId,
  ])

  const setMulticallUpdaterChainId = useUpdateAtom(multicallUpdaterSwapChainIdAtom)
  useEffect(() => {
    const chainId = (multichainUXEnabled ? selectedChainId : account.chainId) ?? undefined
    setMulticallUpdaterChainId(chainId)
  }, [account.chainId, multichainUXEnabled, selectedChainId, setMulticallUpdaterChainId])

  const value = useMemo(() => {
    return {
      currencyState,
      setCurrencyState,
      setSelectedChainId,
      currentTab,
      setCurrentTab,
      prefilledState,
      initialChainId,
      chainId: (multichainUXEnabled ? selectedChainId : account.chainId) ?? undefined,
      multichainUXEnabled,
      isSwapAndLimitContext: true,
      isUserSelectedToken,
      setIsUserSelectedToken,
    }
  }, [
    initialChainId,
    account.chainId,
    selectedChainId,
    currencyState,
    currentTab,
    prefilledState,
    multichainUXEnabled,
    isUserSelectedToken,
  ])

  useReportTotalBalancesUsdForAnalytics()

  return <SwapAndLimitContext.Provider value={value}>{children}</SwapAndLimitContext.Provider>
}

export function SwapContextProvider({
  initialTypedValue,
  initialIndependentField,
  multichainUXEnabled,
  children,
}: {
  initialTypedValue?: string
  initialIndependentField?: CurrencyField
  multichainUXEnabled?: boolean
  children: React.ReactNode
}) {
  const [swapState, setSwapState] = useState<SwapState>({
    typedValue: initialTypedValue ?? initialSwapState.typedValue,
    independentField: initialIndependentField ?? initialSwapState.independentField,
  })
  const derivedSwapInfo = useDerivedSwapInfo(swapState)

  const { chainId: connectedChainId } = useAccount()
  const previousConnectedChainId = usePrevious(connectedChainId)

  const { chainId: swapChainId } = useSwapAndLimitContext()
  const previousSwapChainId = usePrevious(swapChainId)

  useEffect(() => {
    const connectedChainIdChanged = previousConnectedChainId && previousConnectedChainId !== connectedChainId
    const swapChainIdChanged = previousSwapChainId && previousSwapChainId !== swapChainId
    if (multichainUXEnabled) {
      if (swapChainIdChanged) {
        setSwapState((prev) => ({ ...prev, typedValue: '' }))
      }
      return
    }
    if (connectedChainIdChanged) {
      setSwapState((prev) => ({ ...prev, typedValue: '' }))
    }
  }, [connectedChainId, previousConnectedChainId, swapChainId, previousSwapChainId, multichainUXEnabled])

  return <SwapContext.Provider value={{ swapState, setSwapState, derivedSwapInfo }}>{children}</SwapContext.Provider>
}
