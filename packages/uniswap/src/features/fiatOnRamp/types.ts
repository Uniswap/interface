import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import {
  LocalOffRampTransactionInfo,
  LocalOnRampTransactionInfo,
  OffRampSaleInfo,
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { FiatCurrencyComponents } from 'utilities/src/format/localeBased'

// Moonpay Legacy Info

export type FiatOnRampTransactionDetails = TransactionDetails & {
  typeInfo: LocalOnRampTransactionInfo | OnRampPurchaseInfo | OnRampTransferInfo
}

export type FiatOffRampTransactionDetails = TransactionDetails & {
  typeInfo: LocalOffRampTransactionInfo | OffRampSaleInfo
}

export type FORTransactionDetails = FiatOnRampTransactionDetails | FiatOffRampTransactionDetails

export type FORCountry = {
  countryCode: string
  displayName: string
  state: string | undefined
}

// /get-country

export type FORGetCountryResponse = FORCountry

// /supported-countries

export type FORSupportedCountriesRequest = {
  rampDirection?: RampDirection
}

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
  rampDirection?: RampDirection
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

export enum FORFilters {
  ApplePay = 'Apple Pay',
  GooglePay = 'Google Pay',
  Bank = 'Bank',
  Debit = 'Debit',
  PayPal = 'PayPal',
  Venmo = 'Venmo',
}

// TODO[GROW-560]: Replace this mapping with TYPE field from BE
export const FORFiltersMap: Record<string, FORFilters> = {
  'Apple Pay': FORFilters.ApplePay,
  'Google Pay': FORFilters.GooglePay,
  'Same Day ACH': FORFilters.Bank,
  ACH: FORFilters.Bank,
  'Debit Card': FORFilters.Debit,
  'Payout via Debit Card': FORFilters.Debit,
  PayPal: FORFilters.PayPal,
  Venmo: FORFilters.Venmo,
  'Local Manual Bank Transfer': FORFilters.Bank,
  Fast: FORFilters.Bank,
  FPX: FORFilters.Bank,
  iDeal: FORFilters.Bank,
  IMPS: FORFilters.Bank,
  Khipu: FORFilters.Bank,
  'Instant Bank Transfer - Open Banking': FORFilters.Bank,
  'Instant Bank Transfer': FORFilters.Bank,
  PIX: FORFilters.Bank,
  PromptPay: FORFilters.Bank,
  PSE: FORFilters.Bank,
  'Revolut Pay': FORFilters.Bank,
  SEPA: FORFilters.Bank,
  'SEPA Instant': FORFilters.Bank,
  SPEI: FORFilters.Bank,
  STP: FORFilters.Bank,
  SWIFT: FORFilters.Bank,
  'Thai QR Payments': FORFilters.Bank,
  'UK Faster Payments': FORFilters.Bank,
  UPI: FORFilters.Bank,
  VietQR: FORFilters.Bank,
}

export type FORServiceProvidersResponse = {
  serviceProviders: FORServiceProvider[]
}

// /supported-tokens

export type FORSupportedTokensRequest = {
  fiatCurrency: string
  countryCode: string
  rampDirection?: RampDirection
  isSolanaEnabled?: boolean
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
  rampDirection?: RampDirection
}

export type FORSupportedFiatCurrency = {
  fiatCurrencyCode: string
  displayName: string
  symbol: string
}

export type FORSupportedFiatCurrenciesResponse = {
  fiatCurrencies: FORSupportedFiatCurrency[]
}

// /widget-url and /offramp-widget-url

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

export type OffRampWidgetUrlRequest = {
  sourceAmount: number
  baseCurrencyCode: string
  refundWalletAddress: string
  countryCode: string
  quoteCurrencyCode: string
  serviceProvider: string
  externalSessionId: string
  lockAmount?: string
  requestSource?: string
  externalTransactionId?: string
  externalCustomerId?: string
  redirectUrl?: string
}

// /transfer-widget-url

export type FORTransferWidgetUrlRequest = {
  serviceProvider: string
  walletAddress: string
  externalSessionId: string
  redirectUrl: string
}

// /offramp-transfer-details

export type OffRampTransferDetailsRequest = MoonpayOffRampTransferDetailsRequest | MeldOffRampTransferDetailsRequest

// TODO: verify that this is needed and BE cannot also use a sessionId
type MoonpayOffRampTransferDetailsRequest = {
  moonpayDetails: {
    baseCurrencyCode: string
    baseCurrencyAmount: number
    depositWalletAddress: string
    depositWalletAddressTag?: string
  }
}

type MeldOffRampTransferDetailsRequest = {
  meldDetails: {
    sessionId: string
  }
}

export type OffRampTransferDetailsResponse = {
  chainId: string
  provider: string
  tokenAddress: string
  baseCurrencyCode: string
  baseCurrencyAmount: number
  depositWalletAddress: string
  logos: {
    darkLogo: string
    lightLogo: string
    darkFullLogo: string
    lightFullLogo: string
  }
  depositWalletAddressTag?: string
  errorCode?: string
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
  sourceAmount?: number
  sourceCurrencyCode: string
  destinationAmount?: number
  destinationCurrencyCode: string
  destinationContractAddress: string
  serviceProviderDetails: FORServiceProvider
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

export interface FiatOffRampMetaData {
  name: string
  logoUrl: string
  onSubmitCallback: (amountUSD?: number) => void
  meldCurrencyCode?: string
  moonpayCurrencyCode?: string
}

export enum InitialQuoteSelection {
  MostRecent = 0,
  Best = 1,
}

export type FiatCurrencyInfo = {
  name: string
  shortName: string
  code: string
} & FiatCurrencyComponents

export type FORCurrencyOrBalance = FiatOnRampCurrency | PortfolioBalance

export enum RampToggle {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum RampDirection {
  ONRAMP = 0,
  OFFRAMP = 1,
}
