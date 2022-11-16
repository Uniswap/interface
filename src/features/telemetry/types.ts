import { TraceProps } from 'src/components/telemetry/Trace'
import { TraceEventProps } from 'src/components/telemetry/TraceEvent'
import { ImportType } from 'src/features/onboarding/utils'
import { EventName } from 'src/features/telemetry/constants'

type BaseEventProperty = Partial<TraceEventProps & TraceProps> | undefined

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
  [EventName.SwapQuoteReceived]: {
    token_in_symbol?: string
    token_out_symbol?: string
    token_in_address: string
    token_out_address: string
    price_impact_basis_points?: string
    estimated_network_fee_usd?: number
    chain_id: number
    token_in_amount: string
    token_out_amount: string
    quote_latency_milliseconds?: number
  } & BaseEventProperty
}

export type TelemetryEventProps = {
  // Left this one as name as it's being used all over the app already
  name?: TraceEventProps['elementName']
} & Partial<Pick<TraceEventProps, 'eventName' | 'events' | 'properties'>>

export type TelemetryTraceProps = Omit<TraceProps, 'logImpression' | 'startMark' | 'endMark'>
