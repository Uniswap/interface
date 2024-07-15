import { Currency } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import usePrevious from 'hooks/usePrevious'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import { CurrencyState, SwapAndLimitContext, SwapContext, SwapState, initialSwapState } from 'state/swap/types'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { SwapTab } from 'uniswap/src/types/screens/interface'

export function SwapAndLimitContextProvider({
  children,
  initialChainId,
  initialInputCurrency,
  initialOutputCurrency,
  multichainUXEnabled,
}: PropsWithChildren<{
  initialChainId?: InterfaceChainId
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  multichainUXEnabled?: boolean
}>) {
  const [selectedChainId, setSelectedChainId] = useState<InterfaceChainId | undefined | null>(initialChainId)
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
    const combinedCurrencyState = { ...currencyState, ...prefilledState }
    const chainChanged = previousConnectedChainId && previousConnectedChainId !== account.chainId
    const prefilledInputChanged = Boolean(
      previousPrefilledState?.inputCurrency
        ? !prefilledState.inputCurrency?.equals(previousPrefilledState.inputCurrency)
        : prefilledState.inputCurrency,
    )
    const prefilledOutputChanged = Boolean(
      previousPrefilledState?.outputCurrency
        ? !prefilledState?.outputCurrency?.equals(previousPrefilledState.outputCurrency)
        : prefilledState.outputCurrency,
    )

    if ((!multichainUXEnabled && chainChanged) || prefilledInputChanged || prefilledOutputChanged) {
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
    if (initialChainId) {
      setSelectedChainId(initialChainId)
    }
  }, [initialChainId, setSelectedChainId])

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
    }
  }, [initialChainId, account.chainId, selectedChainId, currencyState, currentTab, prefilledState, multichainUXEnabled])

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
