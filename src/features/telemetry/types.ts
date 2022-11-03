import { EventName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { AppScreen } from 'src/screens/Screens'

type BaseEventProperty =
  | { screen?: AppScreen; modal?: ModalName; section?: SectionName }
  | undefined

export type EventProperties = {
  [EventName.UserEvent]: BaseEventProperty
  [EventName.Impression]: BaseEventProperty
  [EventName.MarkMeasure]: BaseEventProperty
  [EventName.Transaction]: BaseEventProperty
}
