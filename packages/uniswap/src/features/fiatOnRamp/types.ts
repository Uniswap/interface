import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FiatCurrencyComponents } from 'utilities/src/format/localeBased'

export type FORCountry = {
  countryCode: string
  displayName: string
  state: string | undefined
}

// /get-country

export type FORGetCountryResponse = FORCountry

// /supported-countries

export type FORSupportedCountriesResponse = {
  supportedCountries: FORCountry[]
}

// /quote

export type FORQuoteRequest = {
  countryCode: string
  destinationCurrencyCode: string
  sourceAmount: number
  sourceCurrencyCode: string
  walletAddress?: string
  state?: string
}

export type FORQuote = {
  countryCode: string | null
  sourceAmount: number
  sourceCurrencyCode: string
  destinationAmount: number
  destinationCurrencyCode: string
  serviceProviderDetails: FORServiceProvider
  totalFee: number
  isMostRecentlyUsedProvider: boolean
}

export type FORQuoteResponse = {
  quotes: Maybe<FORQuote[]>
  message: string | null
  error: string | null
}

// /service-providers

export type FORLogo = {
  darkLogo: string
  lightLogo: string
}

export type FORServiceProvider = {
  serviceProvider: string
  name: string
  url: string
  logos: FORLogo
  paymentMethods: string[]
  supportUrl?: string
}

export type FORServiceProvidersResponse = {
  serviceProviders: FORServiceProvider[]
}

// /supported-tokens

export type FORSupportedTokensRequest = {
  fiatCurrency: string
  countryCode: string
}

export type FORSupportedToken = {
  cryptoCurrencyCode: string
  displayName: string
  address: string
  cryptoCurrencyChain: string
  chainId: string
  symbol: string
}

export type FORSupportedTokensResponse = {
  supportedTokens: FORSupportedToken[]
}

// /supported-fiat-currencies

export type FORSupportedFiatCurrenciesRequest = {
  countryCode: string
}

export type FORSupportedFiatCurrency = {
  fiatCurrencyCode: string
  displayName: string
  symbol: string
}

export type FORSupportedFiatCurrenciesResponse = {
  fiatCurrencies: FORSupportedFiatCurrency[]
}

// /widget-url

export type FORWidgetUrlRequest = {
  sourceAmount: number
  sourceCurrencyCode: string
  destinationCurrencyCode: string
  countryCode: string
  serviceProvider: string
  walletAddress: string
  externalSessionId: string
  redirectUrl?: string
}

export type FORWidgetUrlResponse = {
  id: string
  widgetUrl: string
}

// /transfer-widget-url

export type FORTransferWidgetUrlRequest = {
  serviceProvider: string
  walletAddress: string
  externalSessionId: string
  redirectUrl: string
}

// /transactions

export type FORCryptoDetails = {
  walletAddress: string
  networkFee: number
  transactionFee: number
  totalFee: number
  blockchainTransactionId: string
  chainId: string
}

export type FORTransaction = {
  id: string
  status: string
  sourceAmount: number
  sourceCurrencyCode: string
  destinationAmount: number
  destinationCurrencyCode: string
  destinationContractAddress: string
  serviceProvider: string
  cryptoDetails: FORCryptoDetails
  createdAt: string
  updatedAt: string
  externalSessionId: string
}

export type FORTransactionRequest = {
  sessionId?: string
  forceFetch?: boolean
}

export type FORTransactionResponse = {
  transaction?: FORTransaction
}

export type FiatOnRampCurrency = {
  currencyInfo: Maybe<CurrencyInfo>
  moonpayCurrencyCode?: string
  meldCurrencyCode?: string
}

export enum InitialQuoteSelection {
  MostRecent,
  Best,
}

export type FiatCurrencyInfo = {
  name: string
  shortName: string
  code: string
} & FiatCurrencyComponents
