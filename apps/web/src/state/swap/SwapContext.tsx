import { ChainId, Currency } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import usePrevious from 'hooks/usePrevious'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import { CurrencyState, SwapAndLimitContext, SwapContext, SwapState, initialSwapState } from 'state/swap/types'
import { SwapTab } from 'uniswap/src/types/screens/interface'

export function SwapAndLimitContextProvider({
  children,
  chainId,
  initialInputCurrency,
  initialOutputCurrency,
  multichainUXEnabled,
}: PropsWithChildren<{
  chainId?: ChainId
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  multichainUXEnabled?: boolean
}>) {
  const [selectedChainId, setSelectedChainId] = useState<ChainId | undefined>(chainId)
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
    [initialInputCurrency, initialOutputCurrency]
  )

  const account = useAccount()
  const previousConnectedChainId = usePrevious(account.chainId)
  const previousInitialInputCurrency = usePrevious(initialInputCurrency)
  const previousInitialOutputCurrency = usePrevious(initialOutputCurrency)

  useEffect(() => {
    if (!multichainUXEnabled) {
      return
    }

    if (previousInitialInputCurrency && previousInitialInputCurrency !== initialInputCurrency) {
      setCurrencyState((prev) => ({ ...prev, inputCurrency: initialInputCurrency }))
    }
  }, [
    multichainUXEnabled,
    initialInputCurrency,
    initialOutputCurrency,
    previousInitialInputCurrency,
    previousInitialOutputCurrency,
  ])

  const previousPrefilledState = usePrevious(prefilledState)

  useEffect(() => {
    if (multichainUXEnabled) {
      return
    }
    const combinedCurrencyState = { ...currencyState, ...prefilledState }
    const chainChanged = previousConnectedChainId && previousConnectedChainId !== account.chainId
    const prefilledInputChanged = Boolean(
      previousPrefilledState?.inputCurrency
        ? !prefilledState.inputCurrency?.equals(previousPrefilledState.inputCurrency)
        : prefilledState.inputCurrency
    )
    const prefilledOutputChanged = Boolean(
      previousPrefilledState?.outputCurrency
        ? !prefilledState?.outputCurrency?.equals(previousPrefilledState.outputCurrency)
        : prefilledState.outputCurrency
    )

    if (chainChanged || prefilledInputChanged || prefilledOutputChanged) {
      setCurrencyState({
        inputCurrency: combinedCurrencyState.inputCurrency ?? undefined,
        outputCurrency: combinedCurrencyState.outputCurrency ?? undefined,
      })
    }
  }, [
    multichainUXEnabled,
    account.chainId,
    currencyState,
    prefilledState,
    previousConnectedChainId,
    previousPrefilledState,
  ])

  useEffect(() => {
    if (chainId) {
      setSelectedChainId(chainId)
    }
  }, [chainId, setSelectedChainId])

  const value = useMemo(() => {
    return {
      currencyState,
      setCurrencyState,
      setSelectedChainId,
      currentTab,
      setCurrentTab,
      prefilledState,
      chainId: multichainUXEnabled ? selectedChainId : chainId,
      multichainUXEnabled,
    }
  }, [chainId, currencyState, currentTab, multichainUXEnabled, prefilledState, selectedChainId])

  return <SwapAndLimitContext.Provider value={value}>{children}</SwapAndLimitContext.Provider>
}

export function SwapContextProvider({
  multichainUXEnabled,
  children,
}: {
  multichainUXEnabled?: boolean
  children: React.ReactNode
}) {
  const [swapState, setSwapState] = useState<SwapState>({
    ...initialSwapState,
  })
  const derivedSwapInfo = useDerivedSwapInfo(swapState)

  const { chainId: connectedChainId } = useAccount()
  const previousConnectedChainId = usePrevious(connectedChainId)

  useEffect(() => {
    const chainChanged = previousConnectedChainId && previousConnectedChainId !== connectedChainId
    if (multichainUXEnabled) {
      return
    }
    if (chainChanged) {
      setSwapState((prev) => ({ ...prev, typedValue: '' }))
    }
  }, [connectedChainId, previousConnectedChainId, multichainUXEnabled])

  return <SwapContext.Provider value={{ swapState, setSwapState, derivedSwapInfo }}>{children}</SwapContext.Provider>
}
