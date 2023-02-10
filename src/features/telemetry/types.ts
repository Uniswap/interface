import { RenderPassReport } from '@shopify/react-native-performance'
import { TraceProps } from 'src/components/telemetry/Trace'
import { TraceEventProps } from 'src/components/telemetry/TraceEvent'
import { MoonpayIPAddressesResponse } from 'src/features/fiatOnRamp/types'
import { ImportType } from 'src/features/onboarding/utils'
import { EventName } from 'src/features/telemetry/constants'
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
  [EventName.AppLoaded]: BaseEventProperty
  [EventName.DeepLinkOpened]: {
    url: string
    screen: 'swap' | 'transaction'
    is_cold_start: boolean
  }
  [EventName.FiatOnRampRegionCheck]: { networkStatus: 'success' | 'failed' } & Pick<
    MoonpayIPAddressesResponse,
    'isBuyAllowed' | 'isAllowed' | 'isSellAllowed' | 'alpha3'
  > &
    BaseEventProperty
  [EventName.FiatOnRampQuickActionButtonPressed]: BaseEventProperty
  [EventName.FiatOnRampBannerPressed]: BaseEventProperty
  [EventName.FiatOnRampWidgetOpened]: BaseEventProperty & { externalTransactionId: string }
  [EventName.Impression]: BaseEventProperty
  [EventName.MarkMeasure]: BaseEventProperty
  [EventName.Moonpay]: MoonpayTransactionEventProperties
  [EventName.OnboardingCompleted]: {
    // TODO(MOB-3547) Enforce ImportType in all OnboardingScreens
    wallet_type?: ImportType
    accounts_imported_count: number
  } & BaseEventProperty
  [EventName.PerformanceReport]: RenderPassReport
  [EventName.PerformanceGraphql]: {
    dataSize: number
    duration: number
    operationName: string
    operationType?: string
  }
  [EventName.WalletAdded]: {
    wallet_type?: ImportType
    accounts_imported_count: number
  } & BaseEventProperty
  [EventName.SwapSubmitButtonPressed]: {
    estimated_network_fee_wei?: string
    gas_limit?: string
    transaction_deadline_seconds?: number
    token_in_amount_usd?: number
    token_out_amount_usd?: number
    is_auto_slippage?: boolean
    swap_quote_block_number?: string
  } & SwapTradeBaseProperties
  [EventName.SwapSubmitted]: {
    transaction_hash: string
  } & SwapTradeBaseProperties
  [EventName.SwapQuoteReceived]: {
    quote_latency_milliseconds?: number
  } & SwapTradeBaseProperties
  [EventName.TokenDetailsOtherChainButtonPressed]: BaseEventProperty
  [EventName.UserEvent]: BaseEventProperty
  [EventName.WalletConnectSheetCompleted]: {
    request_type: WCEventType
    eth_method?: EthMethod
    dapp_url: string
    dapp_name: string
    wc_version: '1' | '2'
    chain_id?: number
    outcome: WCRequestOutcome
  }
}

export type TelemetryEventProps = {
  // Left this one as name as it's being used all over the app already
  name?: TraceEventProps['elementName']
} & Partial<Pick<TraceEventProps, 'eventName' | 'events' | 'properties'>>

export type TelemetryTraceProps = Omit<TraceProps, 'logImpression' | 'startMark' | 'endMark'>
