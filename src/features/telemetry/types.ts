import { TraceProps } from 'src/components/telemetry/Trace'
import { TraceEventProps } from 'src/components/telemetry/TraceEvent'
import { EventName } from 'src/features/telemetry/constants'

type BaseEventProperty = Partial<TraceEventProps & TraceProps> | undefined

export type EventProperties = {
  [EventName.AppLoaded]: BaseEventProperty
  [EventName.UserEvent]: BaseEventProperty
  [EventName.Impression]: BaseEventProperty
  [EventName.MarkMeasure]: BaseEventProperty
  [EventName.Transaction]: BaseEventProperty
}

export type TelemetryEventProps = {
  // Left this one as name as it's being used all over the app already
  name?: TraceEventProps['elementName']
} & Partial<Pick<TraceEventProps, 'eventName' | 'events' | 'properties'>>

export type TelemetryTraceProps = Omit<TraceProps, 'logImpression' | 'startMark' | 'endMark'>
