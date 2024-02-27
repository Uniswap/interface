import { Currency } from '@uniswap/sdk-core'
import { FunctionComponent } from 'react'
import { SvgProps } from 'react-native-svg'
import { ColorTokens } from 'ui/src'
import { ThemeNames } from 'ui/src/theme'

export enum WarningSeverity {
  None = 0,
  Low = 1,
  Medium = 5,
  High = 10,
}

export type WarningColor = {
  text: ColorTokens
  background: ColorTokens
  buttonTheme: ThemeNames
}

export enum WarningAction {
  None = 'none',

  // prevents users from continuing to the review screen
  DisableReview = 'disable_review',

  // allows users to continue to review screen, but requires them to
  // acknowledge a popup warning before submitting
  WarnBeforeSubmit = 'warn_before_submit',

  // same as WarnBeforeSubmit but pops up after recipient is selected (transfer only)
  WarnAfterRecipientSelect = 'warn_after_recipient_select',

  // prevents submission altogether
  DisableSubmit = 'disable_submit',
}

export enum WarningLabel {
  InsufficientFunds = 'insufficient_funds',
  InsufficientGasFunds = 'insufficient_gas_funds',
  FormIncomplete = 'form_incomplete',
  UnsupportedNetwork = 'unsupported_network',
  PriceImpactMedium = 'price_impact_medium',
  PriceImpactHigh = 'price_impact_high',
  LowLiquidity = 'low_liquidity',
  SwapRouterError = 'swap_router_error',
  RateLimit = 'rate_limit',
  RecipientZeroBalances = 'recipient_zero_balances',
  RecipientNewAddress = 'recipient_new_address',
  RecipientIsSmartContract = 'recipient_is_smart_contract',
  ViewOnlyAccount = 'view_only_account',
  NetworkError = 'network_error',
}

export interface Warning {
  type: WarningLabel
  severity: WarningSeverity
  action: WarningAction
  title?: string
  buttonText?: string
  message?: string
  icon?: FunctionComponent<SvgProps>
  currency?: Currency
}
