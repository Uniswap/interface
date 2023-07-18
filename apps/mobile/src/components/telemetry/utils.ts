import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { NativeSyntheticEvent, NativeTouchEvent } from 'react-native'
import { ITraceContext } from 'src/components/telemetry/TraceContext'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName } from 'src/features/telemetry/constants'

const EVENTS_HANDLED = ['onPress']

/**
 * Given a set of child element and action props, returns a spreadable
 * object of the event handlers augmented with telemetry logging.
 */
export function getEventHandlers(
  child: React.ReactElement,
  consumedProps: ITraceContext,
  eventName: MobileEventName | SharedEventName.ELEMENT_CLICKED,
  elementName?: ElementName,
  properties?: Record<string, unknown>
): Partial<Record<string, (e: NativeSyntheticEvent<NativeTouchEvent>) => void>> {
  const eventHandlers: Partial<
    Record<string, (e: NativeSyntheticEvent<NativeTouchEvent>) => void>
  > = {}
  for (const event of EVENTS_HANDLED) {
    eventHandlers[event] = (eventHandlerArgs: unknown): void => {
      // call child event handler with original arguments
      child.props[event].apply(child, [eventHandlerArgs])

      // augment handler with analytics logging
      // NOTE: on type error, ensure `EventProperties` contains a record for new `EventName`
      sendAnalyticsEvent(eventName, {
        ...consumedProps,
        ...properties,
        /**
         * For consistency in amplitude, we want all event elements to be labeled with field name 'element'.
         * This ensures that behavior from 'Trace' component is the same as the approach we use in declarative logging.
         *
         * Examples: <TraceEvent elementName={elementName} ... /> will match sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {element: ElementName.Swap} ...)
         */
        element: elementName,
      })
    }
  }
  // return a spreadable event handler object
  return eventHandlers
}
