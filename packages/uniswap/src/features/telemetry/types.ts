import { ApolloError } from '@apollo/client'
import { TransactionRequest as EthersTransactionRequest } from '@ethersproject/providers'
import { SerializedError } from '@reduxjs/toolkit'
// eslint-disable-next-line no-restricted-imports
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { MoonpayEventName, SharedEventName, SwapEventName } from '@uniswap/analytics-events'
import { Protocol } from '@uniswap/router-sdk'
import {
  ExtensionEventName,
  FiatOnRampEventName,
  InstitutionTransferEventName,
  MobileAppsFlyerEvents,
  MobileEventName,
  UnitagEventName,
  WalletEventName,
} from 'uniswap/src/features/telemetry/constants'
import { UnitagClaimContext } from 'uniswap/src/features/unitags/types'
import { RenderPassReport } from 'uniswap/src/types/RenderPassReport'
import { ChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { ImportType } from 'uniswap/src/types/onboarding'
import { QuoteType } from 'uniswap/src/types/quote'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import {
  EthMethod,
  UwULinkMethod,
  WCEventType,
  WCRequestOutcome,
} from 'uniswap/src/types/walletConnect'
import { WidgetEvent, WidgetType } from 'uniswap/src/types/widgets'

import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

// Events related to Moonpay internal transactions
// NOTE: we do not currently have access to the full life cycle of these txs
// because we do not yet use Moonpay's webhook
export type MoonpayTransactionEventProperties = ITraceContext &
  // allow any object of strings for now
  Record<string, string>

export type AssetDetailsBaseProperties = {
  name?: string
  domain?: string
  address: string
  chain?: number
}

export type SearchResultContextProperties = {
  category?: string
  query?: string
  suggestion_count?: number
  position?: number
  isHistory?: boolean
}

type OnboardingCompletedProps = {
  wallet_type: ImportType
  accounts_imported_count: number
  wallets_imported: string[]
  cloud_backup_used: boolean
}

export type SwapTradeBaseProperties = {
  allowed_slippage_basis_points?: number
  token_in_symbol?: string
  token_out_symbol?: string
  token_in_address: string
  token_out_address: string
  price_impact_basis_points?: string
  estimated_network_fee_usd?: number
  chain_id: number
  token_in_amount: string
  token_out_amount: string
  fee_amount?: string
  quoteType?: QuoteType
  requestId?: string
  quoteId?: string
} & ITraceContext

type SwapTransactionResultProperties = {
  address: string
  chain_id: number
  hash: string
  added_time: number
  confirmed_time?: number
  gas_used?: number
  effective_gas_price?: number
  tradeType: string
  inputCurrencyId: string
  outputCurrencyId: string
  slippageTolerance?: number
  gasUseEstimate?: string
  route?: string
  quoteId?: string
  submitViaPrivateRpc?: boolean
  protocol?: Protocol
  transactedUSDValue?: number
  quoteType?: QuoteType
}

type TransferProperties = {
  chainId: ChainId
  tokenAddress: Address
  toAddress: Address
}

export type WindowEthereumRequestProperties = {
  method: string
  dappUrl: string
  chainId?: string // Hexadecimal string format to match the JSON-RPC spec
}

export type DappContextProperties = {
  dappUrl: string
  chainId: ChainId
  activeConnectedAddress: Address
  connectedAddresses: Address[]
}

// Please sort new values by EventName type!
export type UniverseEventProperties = {
  [ExtensionEventName.ExtensionLoad]: undefined
  [ExtensionEventName.DappConnect]: DappContextProperties
  [ExtensionEventName.DappConnectRequest]: DappContextProperties
  [ExtensionEventName.DappChangeChain]: Omit<DappContextProperties, 'connectedAddresses'>
  [ExtensionEventName.ProviderDirectMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.ExtensionEthMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.DeprecatedMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.UnknownMethodRequest]: WindowEthereumRequestProperties
  [FiatOnRampEventName.FiatOnRampAmountEntered]: ITraceContext & { source: 'chip' | 'textInput' }
  [FiatOnRampEventName.FiatOnRampTokenSelected]: ITraceContext & { token: string }
  [FiatOnRampEventName.FiatOnRampTransactionUpdated]: {
    status: string
    externalTransactionId: string
    serviceProvider: string
  }
  [FiatOnRampEventName.FiatOnRampWidgetOpened]: ITraceContext & {
    countryCode?: string
    countryState?: string
    cryptoCurrency: string
    externalTransactionId: string
    fiatCurrency: string
    preselectedServiceProvider?: string
    serviceProvider: string
  }
  [FiatOnRampEventName.FiatOnRampAmountEntered]: ITraceContext & { source: 'chip' | 'textInput' }
  [FiatOnRampEventName.FiatOnRampTokenSelected]: ITraceContext & { token: string }
  [FiatOnRampEventName.FiatOnRampTransactionUpdated]: {
    status: string
    externalTransactionId: string
    serviceProvider: string
  }
  [FiatOnRampEventName.FiatOnRampWidgetOpened]: ITraceContext & {
    countryCode?: string
    countryState?: string
    cryptoCurrency: string
    externalTransactionId: string
    fiatCurrency: string
    preselectedServiceProvider?: string
    serviceProvider: string
  }
  [InstitutionTransferEventName.InstitutionTransferTransactionUpdated]: {
    status: string
    externalTransactionId: string
    serviceProvider: string
  }
  [InstitutionTransferEventName.InstitutionTransferWidgetOpened]: ITraceContext & {
    externalTransactionId: string
    serviceProvider: string
  }
  [MobileEventName.ExtensionPromoBannerActionTaken]: {
    action: 'join' | 'dismiss'
  }
  [MobileEventName.AppRating]: {
    type: 'store-review' | 'feedback-form' | 'remind'
    appRatingPromptedMs?: number
    appRatingProvidedMs?: number
  }
  [MobileEventName.BalancesReport]: {
    total_balances_usd: number
    wallets: string[]
    balances: number[]
  }
  [MobileEventName.DeepLinkOpened]: {
    url: string
    screen: 'swap' | 'transaction'
    is_cold_start: boolean
  }
  [MobileEventName.ExploreFilterSelected]: {
    filter_type: string
  }
  [MobileEventName.ExploreSearchResultClicked]: SearchResultContextProperties &
    AssetDetailsBaseProperties & {
      type: 'collection' | 'token' | 'address'
    }
  [MobileEventName.ExploreTokenItemSelected]: AssetDetailsBaseProperties & {
    position: number
  }
  [MobileEventName.FavoriteItem]: AssetDetailsBaseProperties & {
    type: 'token' | 'wallet'
  }
  [MobileEventName.FiatOnRampQuickActionButtonPressed]: ITraceContext
  [MobileEventName.NotificationsToggled]: ITraceContext & {
    enabled: boolean
  }
  [MobileEventName.OnboardingCompleted]: OnboardingCompletedProps & ITraceContext
  [MobileEventName.PerformanceReport]: RenderPassReport
  [MobileEventName.ShareLinkOpened]: {
    entity: ShareableEntity
    url: string
  }
  [MobileEventName.TokenDetailsOtherChainButtonPressed]: ITraceContext
  [MobileEventName.WalletAdded]: OnboardingCompletedProps & ITraceContext
  [MobileEventName.WalletConnectSheetCompleted]: {
    request_type: WCEventType
    eth_method?: EthMethod | UwULinkMethod
    dapp_url: string
    dapp_name: string
    wc_version: string
    connection_chain_ids?: number[]
    chain_id?: number
    outcome: WCRequestOutcome
  }
  [MobileEventName.WidgetConfigurationUpdated]: WidgetEvent
  [MobileEventName.WidgetClicked]: {
    widget_type: WidgetType
    url: string
  }
  [SharedEventName.APP_LOADED]: ITraceContext | undefined
  [SharedEventName.ELEMENT_CLICKED]: ITraceContext
  [SharedEventName.PAGE_VIEWED]: ITraceContext
  [SharedEventName.ANALYTICS_SWITCH_TOGGLED]: {
    enabled: boolean
  }
  [SharedEventName.HEARTBEAT]: undefined
  [MoonpayEventName.MOONPAY_GEOCHECK_COMPLETED]: {
    success: boolean
    networkError: boolean
  } & ITraceContext
  [SharedEventName.ELEMENT_CLICKED]: ITraceContext
  [SharedEventName.PAGE_VIEWED]: ITraceContext
  [SharedEventName.ANALYTICS_SWITCH_TOGGLED]: {
    enabled: boolean
  }
  [SharedEventName.HEARTBEAT]: undefined
  [SharedEventName.TERMS_OF_SERVICE_ACCEPTED]: {
    address: string
  }
  [SwapEventName.SWAP_TRANSACTION_COMPLETED]: SwapTransactionResultProperties
  [SwapEventName.SWAP_TRANSACTION_FAILED]: SwapTransactionResultProperties
  [SwapEventName.SWAP_DETAILS_EXPANDED]: ITraceContext | undefined
  [SwapEventName.SWAP_QUOTE_RECEIVED]: {
    quote_latency_milliseconds?: number
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED]: {
    estimated_network_fee_wei?: string
    gas_limit?: string
    transaction_deadline_seconds?: number
    token_in_amount_usd?: number
    token_out_amount_usd?: number
    is_auto_slippage?: boolean
    swap_quote_block_number?: string
    swap_flow_duration_milliseconds?: number
    is_hold_to_swap?: boolean
    is_fiat_input_mode?: boolean
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED]: {
    error?: ApolloError | FetchBaseQueryError | SerializedError | Error | string
    txRequest?: EthersTransactionRequest
  } & SwapTradeBaseProperties
  [UnitagEventName.UnitagBannerActionTaken]: {
    action: 'claim' | 'dismiss'
    entryPoint: 'home' | 'settings'
  }
  [UnitagEventName.UnitagOnboardingActionTaken]: {
    action: 'select' | 'later'
  }
  [UnitagEventName.UnitagChanged]: undefined
  [UnitagEventName.UnitagClaimAvailabilityDisplayed]: {
    result: 'unavailable' | 'restricted' | 'available'
  }
  [UnitagEventName.UnitagClaimed]: UnitagClaimContext
  [UnitagEventName.UnitagMetadataUpdated]: {
    avatar: boolean
    description: boolean
    twitter: boolean
  }
  [UnitagEventName.UnitagRemoved]: undefined
  [WalletEventName.TokenSelected]: ITraceContext &
    AssetDetailsBaseProperties &
    SearchResultContextProperties & {
      field: CurrencyField
    }
  [WalletEventName.TransferSubmitted]: TransferProperties
  [WalletEventName.TransferCompleted]: TransferProperties
  [WalletEventName.ExploreSearchCancel]: {
    query: string
  }
  [WalletEventName.NetworkFilterSelected]: ITraceContext & {
    chain: ChainId | 'All'
  }
  [WalletEventName.NFTsLoaded]: {
    shown: number
    hidden: number
  }
  [WalletEventName.PerformanceGraphql]: {
    dataSize: number
    duration: number
    operationName: string
    operationType?: string
  }
  [WalletEventName.PortfolioBalanceFreshnessLag]: {
    freshnessLag: number
    updatedCurrencies: string[]
  }
  [WalletEventName.SendRecipientSelected]: {
    domain: string
  }
  [WalletEventName.ShareButtonClicked]: {
    entity: ShareableEntity
    url: string
  }
  [WalletEventName.SwapSubmitted]: {
    transaction_hash: string
  } & SwapTradeBaseProperties
  // Please sort new values by EventName type!
}

export type AppsFlyerEventProperties = {
  [MobileAppsFlyerEvents.OnboardingCompleted]: { importType: ImportType }
  [MobileAppsFlyerEvents.SwapCompleted]: undefined
  [MobileAppsFlyerEvents.WalletFunded]: { sumOfFunds: number }
}
