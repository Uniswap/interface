import { EventName } from 'src/features/telemetry/constants'
import { TraceProps } from 'src/features/telemetry/Trace'
import { TraceEventProps } from 'src/features/telemetry/TraceEvent'

type BaseEventProperty = Partial<TraceEventProps & TraceProps> | undefined

export type EventProperties = {
  [EventName.UserEvent]: BaseEventProperty
  [EventName.Impression]: BaseEventProperty
  [EventName.MarkMeasure]: BaseEventProperty
  [EventName.Transaction]: BaseEventProperty
}

export type TelemetryProps = {
  // Left this one as name as it's being used all over the app already
  name?: TraceEventProps['elementName']
} & Partial<Pick<TraceEventProps, 'eventName' | 'events' | 'properties'>>
