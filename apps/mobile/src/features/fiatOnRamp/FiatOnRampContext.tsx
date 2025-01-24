/**
 * This context is used to persist Fiat On Ramp related data between Fiat On Ramp screens.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SectionListData } from 'react-native'
import { getCountry } from 'react-native-localize'
import { useSelector } from 'react-redux'
import { selectModalState } from 'src/features/modals/selectModalState'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FORQuote, FiatCurrencyInfo, FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

interface FiatOnRampContextType {
  quotesSections?: SectionListData<FORQuote>[] | undefined
  setQuotesSections: (quotesSections: SectionListData<FORQuote>[] | undefined) => void
  selectedQuote?: FORQuote
  setSelectedQuote: (quote: FORQuote | undefined) => void
  countryCode: string
  setCountryCode: (countryCode: string) => void
  countryState: string | undefined
  setCountryState: (countryCode: string | undefined) => void
  baseCurrencyInfo?: FiatCurrencyInfo
  setBaseCurrencyInfo: (baseCurrency: FiatCurrencyInfo | undefined) => void
  quoteCurrency: FiatOnRampCurrency
  defaultCurrency: FiatOnRampCurrency
  setQuoteCurrency: (quoteCurrency: FiatOnRampCurrency) => void
  fiatAmount: number | undefined
  tokenAmount: number | undefined
  setFiatAmount: (fiatAmount: number | undefined) => void
  setTokenAmount: (tokenAmount: number | undefined) => void
  isOffRamp: boolean
  setIsOffRamp: (isOffRamp: boolean) => void
  isTokenInputMode: boolean
  setIsTokenInputMode: React.Dispatch<React.SetStateAction<boolean>>
}

const initialState: FiatOnRampContextType = {
  setQuotesSections: () => undefined,
  setSelectedQuote: () => undefined,
  setCountryCode: () => undefined,
  setCountryState: () => undefined,
  setBaseCurrencyInfo: () => undefined,
  setQuoteCurrency: () => undefined,
  setFiatAmount: () => undefined,
  setTokenAmount: () => undefined,
  fiatAmount: undefined,
  tokenAmount: undefined,
  countryCode: '',
  countryState: undefined,
  quoteCurrency: { currencyInfo: undefined },
  defaultCurrency: { currencyInfo: undefined },
  isOffRamp: false,
  setIsOffRamp: () => undefined,
  isTokenInputMode: false,
  setIsTokenInputMode: () => undefined,
}

const FiatOnRampContext = createContext<FiatOnRampContextType>(initialState)

export function useFiatOnRampContext(): FiatOnRampContextType {
  return useContext(FiatOnRampContext)
}

export function FiatOnRampProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [quotesSections, setQuotesSections] = useState<FiatOnRampContextType['quotesSections']>()
  const [selectedQuote, setSelectedQuote] = useState<FORQuote | undefined>()
  const [countryCode, setCountryCode] = useState<string>(getCountry())
  const [countryState, setCountryState] = useState<string | undefined>()
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState<FiatCurrencyInfo>()
  const [isOffRamp, setIsOffRamp] = useState<boolean>(false)
  const [isTokenInputMode, setIsTokenInputMode] = useState<boolean>(false)
  const [fiatAmount, setFiatAmount] = useState<number | undefined>()
  const [tokenAmount, setTokenAmount] = useState<number | undefined>()

  const { initialState: initialModalState } = useSelector(selectModalState(ModalName.FiatOnRampAggregator))
  const prefilledCurrency = initialModalState?.prefilledCurrency

  // We hardcode ETH as the default starting currency if not specified by modal state's prefilledCurrency
  const ethCurrencyInfo = useCurrencyInfo(
    buildCurrencyId(UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Mainnet)),
  )
  const defaultCurrency = useMemo(
    () => ({
      currencyInfo: ethCurrencyInfo,
      meldCurrencyCode: 'ETH',
    }),
    [ethCurrencyInfo],
  )
  const [quoteCurrency, setQuoteCurrency] = useState<FiatOnRampCurrency>(prefilledCurrency ?? defaultCurrency)

  useEffect(() => {
    // Addresses a race condition where the quoteCurrency could be set before ethCurrencyInfo is loaded
    if (ethCurrencyInfo) {
      setQuoteCurrency(defaultCurrency)
    }
  }, [ethCurrencyInfo, defaultCurrency])

  return (
    <FiatOnRampContext.Provider
      value={{
        selectedQuote,
        setSelectedQuote,
        quotesSections,
        setQuotesSections,
        countryCode,
        setCountryCode,
        countryState,
        setCountryState,
        baseCurrencyInfo,
        setBaseCurrencyInfo,
        quoteCurrency,
        defaultCurrency,
        setQuoteCurrency,
        fiatAmount,
        setFiatAmount,
        tokenAmount,
        setTokenAmount,
        isOffRamp,
        setIsOffRamp,
        isTokenInputMode,
        setIsTokenInputMode,
      }}
    >
      {children}
    </FiatOnRampContext.Provider>
  )
}
