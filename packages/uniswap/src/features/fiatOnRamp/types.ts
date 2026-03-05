/**
 * FOR (Fiat On-Ramp) Types
 *
 * This file re-exports protobuf types from @universe/api and defines
 * app-specific types that extend or combine protobuf types with app data.
 */

// Re-export types for consumer packages
export type {
  FORCountry,
  FORLogo,
  FORQuote,
  FORQuoteResponse,
  FORServiceProvider,
  FORSupportedFiatCurrency,
  FORSupportedToken,
  FORTransaction,
} from '@universe/api'

// Re-export protobuf values (enums/classes) for consumer packages
export {
  FORTransactionStatus,
  OffRampTransferDetailsRequest,
  OffRampTransferDetailsResponse,
  RampDirection,
  SupportedCountriesResponse,
} from '@universe/api'

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

// Transaction types (app-specific, extends TransactionDetails)

export type FiatOnRampTransactionDetails = TransactionDetails & {
  typeInfo: LocalOnRampTransactionInfo | OnRampPurchaseInfo | OnRampTransferInfo
}

export type FiatOffRampTransactionDetails = TransactionDetails & {
  typeInfo: LocalOffRampTransactionInfo | OffRampSaleInfo
}

export type FORTransactionDetails = FiatOnRampTransactionDetails | FiatOffRampTransactionDetails

// Currency types (app-specific, has CurrencyInfo)

export type FiatOnRampCurrency = {
  currencyInfo: Maybe<CurrencyInfo>
  moonpayCurrencyCode?: string
  meldCurrencyCode?: string
}

export type FORCurrencyOrBalance = FiatOnRampCurrency | PortfolioBalance

// Fiat currency display info (app-specific, extends FiatCurrencyComponents)

export type FiatCurrencyInfo = {
  name: string
  shortName: string
  code: string
} & FiatCurrencyComponents

// Off-ramp metadata (app-specific, has callback)

export interface FiatOffRampMetaData {
  name: string
  logoUrl: string
  onSubmitCallback: (amountUSD?: number) => void
  meldCurrencyCode?: string
  moonpayCurrencyCode?: string
}

// App-specific enums

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

export enum InitialQuoteSelection {
  MostRecent = 0,
  Best = 1,
}

export enum RampToggle {
  BUY = 'BUY',
  SELL = 'SELL',
}

// Legacy request/response types for web app transaction polling
export type FORTransactionRequest = {
  sessionId?: string
  forceFetch?: boolean
}
