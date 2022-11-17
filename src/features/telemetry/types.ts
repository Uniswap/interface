import { TraceProps } from 'src/components/telemetry/Trace'
import { TraceEventProps } from 'src/components/telemetry/TraceEvent'
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

export type EventProperties = {
  [EventName.AppLoaded]: BaseEventProperty
  [EventName.UserEvent]: BaseEventProperty
  [EventName.Impression]: BaseEventProperty
  [EventName.MarkMeasure]: BaseEventProperty
  [EventName.OnboardingCompleted]: {
    // TODO(MOB-3547) Enforce ImportType in all OnboardingScreens
    wallet_type?: ImportType
    accounts_imported_count: number
  } & BaseEventProperty
  [EventName.WalletAdded]: {
    wallet_type?: ImportType
    accounts_imported_count: number
  } & BaseEventProperty
  [EventName.Transaction]: BaseEventProperty
  [EventName.SwapSubmitButtonPressed]: {
    estimated_network_fee_wei?: string
    gas_limit?: string
    transaction_deadline_seconds?: number
    token_in_amount_usd?: number
    token_out_amount_usd?: number
    is_auto_slippage?: boolean
    swap_quote_block_number?: string
  } & SwapTradeBaseProperties
  [EventName.SwapQuoteReceived]: {
    quote_latency_milliseconds?: number
  } & SwapTradeBaseProperties
  [EventName.WalletConnectSheetCompleted]: {
    request_type: WCEventType
    eth_method?: EthMethod
    dapp_url: string
    dapp_name: string
    chain_id: number
    outcome: WCRequestOutcome
  }
}

export type TelemetryEventProps = {
  // Left this one as name as it's being used all over the app already
  name?: TraceEventProps['elementName']
} & Partial<Pick<TraceEventProps, 'eventName' | 'events' | 'properties'>>

export type TelemetryTraceProps = Omit<TraceProps, 'logImpression' | 'startMark' | 'endMark'>
