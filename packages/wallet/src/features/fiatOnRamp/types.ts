import {
  FiatPurchaseTransactionInfo,
  TransactionDetails,
} from 'wallet/src/features/transactions/types'

export type FiatOnRampTransactionDetails = TransactionDetails & {
  typeInfo: FiatPurchaseTransactionInfo
}

export type FiatOnRampWidgetUrlQueryParameters = {
  colorCode: string
  externalTransactionId: string
}

export type FiatOnRampWidgetUrlQueryResponse = { url: string }

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#ip_address_object */
export type MoonpayIPAddressData = {
  alpha3?: string
  state?: string
  isAllowed?: boolean
  isBuyAllowed?: boolean
  isSellAllowed?: boolean
}

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#check_ip_address */
export type MoonpayIPAddressesResponse = MoonpayIPAddressData

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#currencies */
export type MoonpayCurrency = {
  id: string
  type: 'crypto' | 'fiat'
  name?: string
  code: string
  supportsTestMode: boolean
  supportsLiveMode: boolean
  notAllowedUSStates: string[]
  isSupportedInUS: boolean
  metadata?: {
    contractAddress: string
    chainId: string
  }
}

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#list_currencies */
export type MoonpayListCurrenciesResponse = MoonpayCurrency[]

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#get_currency_buy_quote */
export type MoonpayBuyQuoteResponse = MoonpayQuote

type CurrencyLimit = {
  code: string
  minBuyAmount: number
  maxBuyAmount: number
}

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#get_currency_limits */
export type MoonpayLimitsResponse = {
  paymentMethod: string
  quoteCurrency: CurrencyLimit
  baseCurrency: CurrencyLimit
  areFeesIncluded: boolean
}

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#transactions */
type MoonpayQuote = {
  // A positive integer representing how much the customer wants to spend. The minimum amount is 20.
  baseCurrencyAmount: number
  // A positive integer representing the amount of cryptocurrency the customer will receive. Set when the purchase of cryptocurrency has been executed.
  quoteCurrencyAmount: number
  quoteCurrencyPrice: number
  // A positive integer representing the fee for the transaction. It is added to baseCurrencyAmount, extraFeeAmount and networkFeeAmount when the customer's card is charged.
  feeAmount: number
  // A positive integer representing your extra fee for the transaction. It is added to baseCurrencyAmount and feeAmount when the customer's card is charged.
  extraFeeAmount: number
  // A positive integer representing the network fee for the transaction. It is added to baseCurrencyAmount, feeAmount and extraFeeAmount when the customer's card is charged.
  networkFeeAmount: number
  // A boolean indicating whether baseCurrencyAmount includes or excludes the feeAmount, extraFeeAmount and networkFeeAmount.
  areFeesIncluded: boolean
}

/**
 * Transaction objects represent cryptocurrency purchases by your end users.
 * @ref https://dashboard.moonpay.com/api_reference/client_side_api#transactions
 */
export type MoonpayTransactionsResponse = Array<MoonpayTransactionResponseItem>

export type MoonpayTransactionResponseItem = MoonpayQuote & {
  // Unique identifier for the object.
  id: string
  // Time at which the object was created. Returned as an ISO 8601 string.
  createdAt: string
  // Time at which the object was last updated. Returned as an ISO 8601 string.
  updatedAt: string
  baseCurrency: MoonpayCurrency
  currency: MoonpayCurrency
  // The transaction's status.
  status: 'waitingPayment' | 'pending' | 'waitingAuthorization' | 'failed' | 'completed'
  // The transaction's failure reason. Set when transaction's status is failed.
  failureReason: string
  // The cryptocurrency wallet address the purchased funds will be sent to.
  walletAddress: string
  // The secondary cryptocurrency wallet address identifier for coins such as EOS, XRP and XMR.
  walletAddressTag: string
  // The cryptocurrency transaction identifier representing the transfer to the customer's wallet. Set when the withdrawal has been executed.
  cryptoTransactionId: string
  // The URL provided to you, when required, to which to redirect the customer as part of a redirect authentication flow.
  redirectUrl: string
  // The URL the customer is returned to after they authenticate or cancel their payment on the payment method’s app or site. If you are using our widget implementation, this is always our transaction tracker page, which provides the customer with real-time information about their transaction.
  returnUrl: string
  // The cryptocurrency transaction identifier representing the transfer from the customer's wallet to MoonPay's wallet. Set when the deposit has been executed and received.
  depositHash?: string
  // An optional URL used in a widget implementation. It is passed to us by you in the query parameters, and we include it as a link on the transaction tracker page.
  widgetRedirectUrl: string
  // The exchange rate between the transaction's base currency and Euro at the time of the transaction.
  eurRate: number
  // The exchange rate between the transaction's base currency and US Dollar at the time of the transaction.
  usdRate: number
  // The exchange rate between the transaction's base currency and British Pound at the time of the transaction.
  gbpRate: number
  // For bank transfer transactions, the information about our bank account to which the customer should make the transfer.
  bankDepositInformation: object
  // For bank transfer transactions, the reference code the customer should cite when making the transfer.
  bankTransferReference: string
  // The identifier of the cryptocurrency the customer wants to purchase.
  currencyId: string
  // The identifier of the fiat currency the customer wants to use for the transaction.
  baseCurrencyId: string
  // The identifier of the customer the transaction is associated with.
  customerId: string
  // For token or card transactions, the identifier of the payment card used for this transaction.
  cardId: string
  // For bank transfer transactions, the identifier of the bank account used for this transaction.
  bankAccountId: string
  // An identifier associated with the customer, provided by you.
  externalCustomerId: string
  // The transaction's payment method. Possible values are credit_debit_card, sepa_bank_transfer, sepa_open_banking_payment, gbp_bank_transfer, gbp_open_banking_payment, ach_bank_transfer, pix_instant_payment and mobile_wallet
  paymentMethod: string
  // An identifier associated with the transaction, provided by you.
  externalTransactionId: string
  // The customer's country. Returned as an ISO 3166-1 alpha-3 code.
  country: string
  // The customer's state, if the customer is from the USA. Returned as a two-letter code.
  state: string
  // An array of four objects, each representing one of the four stages of the purchase process. The attributes of each stage are described below.
  stages: Array<{
    stage:
      | 'stage_one_ordering'
      | 'stage_two_verification'
      | 'stage_three_processing'
      | 'stage_four_delivery'
    status: 'not_started' | 'in_progress' | 'success' | 'failed'
    failureReason:
      | 'card_not_supported'
      | 'daily_purchase_limit_exceeded'
      | 'payment_authorization_declined'
      | 'timeout_3d_secure'
      | 'timeout_bank_transfer'
      | 'timeout_kyc_verification'
      | 'timeout_card_verification'
      | 'rejected_kyc'
      | 'rejected_card'
      | 'rejected_other'
      | 'cancelled'
      | 'refund'
      | 'failed_testnet_withdrawal'
      | 'error'
    // Sometimes| the customer is required to take an action or actions to further the purchase process| usually by submitting information at a provided URL. For each action| we pass an object with a type and a url.
    actions: 'complete_bank_transfer' | 'retry_kyc' | 'verify_card_by_code' | 'verify_card_by_file'
  }>
}

export type FORCountry = {
  countryCode: string
  displayName: string
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
  walletAddress: string
}

export type FORQuote = {
  countryCode: string | null
  sourceAmount: number
  sourceCurrencyCode: string
  destinationAmount: number
  destinationCurrencyCode: string
  serviceProvider: string
  totalFee: number
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

// /transfer-institutions

export type FORTransferInstitutionsRequest = {
  countryCode: string
}

export type FORTransferInstitution = {
  domain: string
  id: string
  icon: string
  key: string
  name: string
  rank: number
  subName: string
}

export type FORTransferInstitutionsResponse = {
  institutions: FORTransferInstitution[]
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
  sourceAmount: number
  sourceCurrencyCode: string
  countryCode: string
  institutionId: string
  walletAddress: string
  externalSessionId: string
  redirectURL: string
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
  serviceProvider: string
  cryptoDetails: FORCryptoDetails
  createdAt: string
  updatedAt: string
  externalSessionId: string
}

export type FORTransactionsRequest = {
  limit?: number
}

export type FORTransactionsResponse = {
  transactions: FORTransaction[]
  count: number
  remaining: number
  totalCount: number
  message: string | null
  error: string | null
}
