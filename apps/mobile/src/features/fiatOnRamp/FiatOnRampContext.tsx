/**
 * This context is used to persist Fiat On Ramp related data between Fiat On Ramp screens.
 */
import React, { createContext, useContext, useState } from 'react'
import { SectionListData } from 'react-native'
import { getCountry } from 'react-native-localize'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { FiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { FORQuote, FORServiceProvider } from 'wallet/src/features/fiatOnRamp/types'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

interface FiatOnRampContextType {
  quotesSections?: SectionListData<FORQuote>[] | undefined
  setQuotesSections: (quotesSections: SectionListData<FORQuote>[] | undefined) => void
  selectedQuote?: FORQuote
  setSelectedQuote: (quote: FORQuote | undefined) => void
  countryCode: string
  setCountryCode: (countryCode: string) => void
  baseCurrencyInfo?: FiatCurrencyInfo
  setBaseCurrencyInfo: (baseCurrency: FiatCurrencyInfo | undefined) => void
  quoteCurrency: FiatOnRampCurrency
  setQuoteCurrency: (quoteCurrency: FiatOnRampCurrency) => void
  amount?: number
  setAmount: (amount: number | undefined) => void
  serviceProviders?: FORServiceProvider[]
  setServiceProviders: (serviceProviders: FORServiceProvider[] | undefined) => void
}

const initialState: FiatOnRampContextType = {
  setQuotesSections: () => undefined,
  setSelectedQuote: () => undefined,
  setCountryCode: () => undefined,
  setBaseCurrencyInfo: () => undefined,
  setQuoteCurrency: () => undefined,
  setAmount: () => undefined,
  setServiceProviders: () => undefined,
  countryCode: '',
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
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState<FiatCurrencyInfo>()
  const [amount, setAmount] = useState<number>()
  const [serviceProviders, setServiceProviders] = useState<FORServiceProvider[]>()

  // We hardcode ETH as the starting currency
  const ethCurrencyInfo = useCurrencyInfo(
    buildCurrencyId(ChainId.Mainnet, getNativeAddress(ChainId.Mainnet))
  )
  const [quoteCurrency, setQuoteCurrency] = useState<FiatOnRampCurrency>({
    currencyInfo: ethCurrencyInfo,
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
        baseCurrencyInfo,
        setBaseCurrencyInfo,
        quoteCurrency,
        setQuoteCurrency,
        amount,
        setAmount,
        serviceProviders,
        setServiceProviders,
      }}>
      {children}
    </FiatOnRampContext.Provider>
  )
}
