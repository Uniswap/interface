import { Currency } from '@uniswap/sdk-core'
import { ColorTokens, GeneratedIcon } from 'ui/src'

export enum WarningSeverity {
  None = 0,
  Low = 1,
  Medium = 5,
  High = 10,
  Blocked = 11,
}

export type WarningColor = {
  text: ColorTokens
  headerText: ColorTokens
  background: ColorTokens
}

export enum WarningAction {
  None = 'none',

  // prevents users from continuing to the review screen
  DisableReview = 'disable_review',

  // allows users to continue to review screen, but requires them to
  // acknowledge a popup warning before submitting
  WarnBeforeSubmit = 'warn_before_submit',

  // same as WarnBeforeSubmit but pops up after recipient is selected (send only)
  WarnAfterRecipientSelect = 'warn_after_recipient_select',

  // prevents submission altogether
  DisableSubmit = 'disable_submit',
}

export enum WarningLabel {
  EnterLargerAmount = 'enter_larger_amount',
  InsufficientFunds = 'insufficient_funds',
  InsufficientGasFunds = 'insufficient_gas_funds',
  FormIncomplete = 'form_incomplete',
  UnsupportedNetwork = 'unsupported_network',
  PriceImpactMedium = 'price_impact_medium',
  PriceImpactHigh = 'price_impact_high',
  LowLiquidity = 'low_liquidity',
  SwapRouterError = 'swap_router_error',
  NoRoutesError = 'no_routes_error',
  RateLimit = 'rate_limit',
  RecipientZeroBalances = 'recipient_zero_balances',
  RecipientNewAddress = 'recipient_new_address',
  RecipientIsSmartContract = 'recipient_is_smart_contract',
  ViewOnlyAccount = 'view_only_account',
  NetworkError = 'network_error',
  BlockedToken = 'blocked_token',
  NoQuotesFound = 'no_quotes_found',
  AztecUnavailable = 'aztec_unavailable',
}

export interface Warning {
  type: WarningLabel
  severity: WarningSeverity
  action: WarningAction
  title?: string
  buttonText?: string
  message?: string
  icon?: GeneratedIcon
  currency?: Currency
  link?: string
}

export type WarningWithStyle = {
  warning: Warning
  color: WarningColor
  Icon: GeneratedIcon | null
  displayedInline: boolean
}

export type ParsedWarnings = {
  blockingWarning?: Warning
  formScreenWarning?: WarningWithStyle
  insufficientBalanceWarning?: Warning
  insufficientGasFundsWarning?: Warning
  priceImpactWarning?: Warning
  reviewScreenWarning?: WarningWithStyle
  warnings: Warning[]
}
