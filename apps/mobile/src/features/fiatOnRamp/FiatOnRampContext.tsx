/**
 * This context is used to persist Fiat On Ramp related data between Fiat On Ramp screens.
 */
import React, { createContext, useContext, useState } from 'react'
import { SectionListData } from 'react-native'
import { getCountry } from 'react-native-localize'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { FORQuote, FiatCurrencyInfo, FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'

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
  setQuoteCurrency: (quoteCurrency: FiatOnRampCurrency) => void
  amount?: number
  setAmount: (amount: number | undefined) => void
}

const initialState: FiatOnRampContextType = {
  setQuotesSections: () => undefined,
  setSelectedQuote: () => undefined,
  setCountryCode: () => undefined,
  setCountryState: () => undefined,
  setBaseCurrencyInfo: () => undefined,
  setQuoteCurrency: () => undefined,
  setAmount: () => undefined,
  countryCode: '',
  countryState: undefined,
  quoteCurrency: { currencyInfo: undefined },
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
  const [amount, setAmount] = useState<number>()

  // We hardcode ETH as the starting currency
  const ethCurrencyInfo = useCurrencyInfo(
    buildCurrencyId(UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Mainnet)),
  )
  const [quoteCurrency, setQuoteCurrency] = useState<FiatOnRampCurrency>({
    currencyInfo: ethCurrencyInfo,
    meldCurrencyCode: 'ETH',
  })

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
        setQuoteCurrency,
        amount,
        setAmount,
      }}
    >
      {children}
    </FiatOnRampContext.Provider>
  )
}
