import { Children, cloneElement, isValidElement, memo, PropsWithChildren, SyntheticEvent } from 'react'

import { sendAnalyticsEvent } from '.'
<<<<<<< HEAD
import { EventName, PartialActionNames } from './constants'
import { ITraceContext, Trace, TraceContext } from './Trace'

type TraceEventProps = {
  actionNames: PartialActionNames
  eventName: EventName
  eventProperties?: Record<string, unknown>
=======
import { Event, EventName } from './constants'
import { ITraceContext, Trace, TraceContext } from './Trace'

type TraceEventProps = {
  events: Event[]
  name: EventName
  properties?: Record<string, unknown>
>>>>>>> main
} & ITraceContext

/**
 * Analytics instrumentation component that wraps event callbacks with logging logic.
 *
 * @example
<<<<<<< HEAD
 *  <TraceEvent actionNames={{ onClick: { action: 'click' }}} elementName={ElementName.SWAP_BUTTON}>
=======
 *  <TraceEvent events={[Event.onClick]} element={ElementName.SWAP_BUTTON}>
>>>>>>> main
 *    <Button onClick={() => console.log('clicked')}>Click me</Button>
 *  </TraceEvent>
 */
export const TraceEvent = memo((props: PropsWithChildren<TraceEventProps>) => {
<<<<<<< HEAD
  const { eventName, eventProperties, actionNames, children, ...traceProps } = props
=======
  const { name, properties, events, children, ...traceProps } = props
>>>>>>> main

  return (
    <Trace {...traceProps}>
      <TraceContext.Consumer>
        {(traceContext) =>
          Children.map(children, (child) => {
            if (!isValidElement(child)) {
              return child
            }

<<<<<<< HEAD
            // For each child, augment event handlers defined in `actionNames`  with event tracing
            return cloneElement(child, getEventHandlers(child, traceContext, actionNames, eventName, eventProperties))
=======
            // For each child, augment event handlers defined in `events` with event tracing.
            return cloneElement(child, getEventHandlers(child, traceContext, events, name, properties))
>>>>>>> main
          })
        }
      </TraceContext.Consumer>
    </Trace>
  )
})

TraceEvent.displayName = 'TraceEvent'

/**
<<<<<<< HEAD
 * Given a set of child element and action props, returns a spreadable
=======
 * Given a set of child element and event props, returns a spreadable
>>>>>>> main
 * object of the event handlers augmented with analytics logging.
 */
function getEventHandlers(
  child: React.ReactElement,
  traceContext: ITraceContext,
<<<<<<< HEAD
  actionNames: PartialActionNames,
  eventName: EventName,
  eventProperties?: Record<string, unknown>
) {
  const eventHandlers: Partial<Record<keyof PartialActionNames, (e: SyntheticEvent<Element, Event>) => void>> = {}
  const keys = (<T,>(obj: T) => Object.keys(obj) as Array<keyof T>)(actionNames)

  for (const eventHandlerName of keys) {
    eventHandlers[eventHandlerName] = (eventHandlerArgs: unknown) => {
      // call child event handler with original arguments
      child.props[eventHandlerName]?.apply(child, eventHandlerArgs)

      // augment handler with analytics logging
      sendAnalyticsEvent(eventName, { ...traceContext, ...eventProperties })
=======
  events: Event[],
  name: EventName,
  properties?: Record<string, unknown>
) {
  const eventHandlers: Partial<Record<Event, (e: SyntheticEvent<Element, Event>) => void>> = {}

  for (const event of events) {
    eventHandlers[event] = (eventHandlerArgs: unknown) => {
      // call child event handler with original arguments, must be in array
      const args = Array.isArray(eventHandlerArgs) ? eventHandlerArgs : [eventHandlerArgs]
      child.props[event]?.apply(child, args)

      // augment handler with analytics logging
      sendAnalyticsEvent(name, { ...traceContext, ...properties, action: event })
>>>>>>> main
    }
  }

  // return a spreadable event handler object
  return eventHandlers
}
