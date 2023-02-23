import { RenderPassReport } from '@shopify/react-native-performance'
import { MoonpayEventName, SharedEventName, SwapEventName } from '@uniswap/analytics-events'
import { TraceProps } from 'src/components/telemetry/Trace'
import { TraceEventProps } from 'src/components/telemetry/TraceEvent'
import { ImportType } from 'src/features/onboarding/utils'
import { MobileEventName } from 'src/features/telemetry/constants'
import { EthMethod, WCEventType, WCRequestOutcome } from 'src/features/walletConnect/types'

type BaseEventProperty = Partial<TraceEventProps & TraceProps> | undefined

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
} & BaseEventProperty

// Events related to Moonpay internal transactions
// NOTE: we do not currently have access to the full life cycle of these txs
// because we do not yet use Moonpay's webhook
export type MoonpayTransactionEventProperties = BaseEventProperty &
  // allow any object of strings for now
  Record<string, string>

export type EventProperties = {
  [MobileEventName.DeepLinkOpened]: {
    url: string
    screen: 'swap' | 'transaction'
    is_cold_start: boolean
  }
  [MobileEventName.ExploreFilterSelected]: {
    filter_type: string
  }
  [MobileEventName.ExploreSearchResultClicked]: {
    query: string
    type: 'collection' | 'token' | 'address'
    suggestion_count: number
    position: number
    name: string
    address: string
    chain?: number
  }
  [MobileEventName.ExploreSearchCancel]: {
    query: string
  }
  [MobileEventName.ExploreTokenItemSelected]: {
    address: string
    name?: string
    position: number
    chain: number
  }
  [MobileEventName.FavoriteItem]: {
    address: string
    name?: string
    chain?: number
    type: 'token' | 'wallet'
  }
  [MobileEventName.FiatOnRampQuickActionButtonPressed]: BaseEventProperty
  [MobileEventName.FiatOnRampBannerPressed]: BaseEventProperty
  [MobileEventName.FiatOnRampWidgetOpened]: BaseEventProperty & { externalTransactionId: string }
  [MobileEventName.OnboardingCompleted]: {
    // TODO(MOB-3547) Enforce ImportType in all OnboardingScreens
    wallet_type?: ImportType
    accounts_imported_count: number
  } & BaseEventProperty
  [MobileEventName.PerformanceReport]: RenderPassReport
  [MobileEventName.PerformanceGraphql]: {
    dataSize: number
    duration: number
    operationName: string
    operationType?: string
  }
  [MobileEventName.SwapSubmitted]: {
    transaction_hash: string
  } & SwapTradeBaseProperties
  [MobileEventName.TokenDetailsOtherChainButtonPressed]: BaseEventProperty
  [MobileEventName.WalletAdded]: {
    wallet_type?: ImportType
    accounts_imported_count: number
  } & BaseEventProperty
  [MobileEventName.WalletConnectSheetCompleted]: {
    request_type: WCEventType
    eth_method?: EthMethod
    dapp_url: string
    dapp_name: string
    wc_version: '1' | '2'
    chain_id?: number
    outcome: WCRequestOutcome
  }
  [MoonpayEventName.MOONPAY_GEOCHECK_COMPLETED]: {
    success: boolean
    networkError: boolean
  } & BaseEventProperty
  [SharedEventName.APP_LOADED]: BaseEventProperty
  [SharedEventName.ELEMENT_CLICKED]: BaseEventProperty
  [SharedEventName.PAGE_VIEWED]: BaseEventProperty
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
  } & SwapTradeBaseProperties
}

export type TelemetryEventProps = {
  // Left this one as name as it's being used all over the app already
  name?: TraceEventProps['elementName']
} & Partial<Pick<TraceEventProps, 'eventName' | 'events' | 'properties'>>

export type TelemetryTraceProps = Omit<TraceProps, 'logImpression' | 'startMark' | 'endMark'>
