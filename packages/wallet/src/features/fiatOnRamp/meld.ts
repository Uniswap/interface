export type MeldCountryPaymentMethodsResponse = Array<{
  country: BaseCountry
  paymentMethods: MeldPaymentMethod[]
}>

export type MeldCryptoQuoteResponse = {
  quotes: Maybe<MeldQuote[]>
  message: string | null
  error: string | null
}

export type MeldServiceProvidersResponse = Array<MeldServiceProvider>

type BaseCountry = {
  countryCode: string
  displayName: string
}

export type MeldPaymentMethod = {
  type: string
  subtype: string
  displayName: string
  logos: MeldLogos
}

export type MeldQuote = {
  transactionType: string
  sourceAmount: number
  sourceAmountWithoutFees: number
  fiatAmountWithoutFees: number
  destinationAmountWithoutFees: number | null
  sourceCurrencyCode: string
  countryCode: string | null
  totalFee: number
  networkFee: number
  transactionFee: number
  destinationAmount: number
  destinationCurrencyCode: string
  exchangeRate: number
  paymentMethodType: string
  customerScore: number
  serviceProvider: string
}

export interface MeldServiceProvider {
  serviceProvider: string
  name: string
  status: string
  categories: Category[]
  categoryStatuses: CategoryStatuses
  authSettingsFields: SettingsField[]
  configSettingsFields: SettingsField[]
  url: string
  logos: MeldLogos
  providerSpecificConfigs?: ProviderSpecificConfigs
}

interface SettingsField {
  fieldName: string
  fieldType: string
  required: boolean
}

enum Category {
  BankLinking = 'BANK_LINKING',
  CryptoOfframp = 'CRYPTO_OFFRAMP',
  CryptoOnramp = 'CRYPTO_ONRAMP',
  FiatPayments = 'FIAT_PAYMENTS',
}

export interface CategoryStatuses {
  FIAT_PAYMENTS?: string
  CRYPTO_ONRAMP?: string
  BANK_LINKING?: string
  CRYPTO_OFFRAMP?: string
}

export interface MeldLogos {
  darkLogo: string
  lightLogo: string
}

interface ProviderSpecificConfigs {
  sdkForm: string
  sdk: string
}

export interface MeldWidgetResponse {
  id: string
  externalSessionId: null | string
  externalCustomerId: null | string
  customerId: string
  widgetUrl: string
  token: string
}

export interface MeldCryptoCurrency {
  address: string
  chainId: string
  cryptoCurrencyChain: string
  cryptoCurrencyCode: string
  displayName: string
  symbol: string
}

export type MeldSupportedToken = {
  crypto: {
    onRamp: {
      cryptoCurrencies: MeldCryptoCurrency[]
      countries: BaseCountry[]
    }
  }
}

export type MeldSupportedTokensResponse = MeldSupportedToken[]

export function getCountryFlagSvgUrl(countryCode: string): string {
  return `https://images-country.meld.io/${countryCode}/flag.svg`
}
