import { Children, cloneElement, isValidElement, memo, PropsWithChildren, SyntheticEvent } from 'react'

import { sendAnalyticsEvent } from '.'
import { EventName, PartialActionNames } from './constants'
import { ITraceContext, Trace, TraceContext } from './Trace'

type TraceEventProps = {
  actionNames: PartialActionNames
  eventName: EventName
  eventProperties?: Record<string, unknown>
} & ITraceContext

/**
 * Analytics instrumentation component that wraps event callbacks with logging logic.
 *
 * @example
 *  <TraceEvent actionNames={{ onClick: { action: 'click' }}} elementName={ElementName.SWAP_BUTTON}>
 *    <Button onClick={() => console.log('clicked')}>Click me</Button>
 *  </TraceEvent>
 */
export const TraceEvent = memo((props: PropsWithChildren<TraceEventProps>) => {
  const { eventName, eventProperties, actionNames, children, ...traceProps } = props

  return (
    <Trace {...traceProps}>
      <TraceContext.Consumer>
        {(traceContext) =>
          Children.map(children, (child) => {
            if (!isValidElement(child)) {
              return child
            }

            // For each child, augment event handlers defined in `actionNames`  with event tracing
            return cloneElement(child, getEventHandlers(child, traceContext, actionNames, eventName, eventProperties))
          })
        }
      </TraceContext.Consumer>
    </Trace>
  )
})

TraceEvent.displayName = 'TraceEvent'

/**
 * Given a set of child element and action props, returns a spreadable
 * object of the event handlers augmented with analytics logging.
 */
function getEventHandlers(
  child: React.ReactElement,
  traceContext: ITraceContext,
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
    }
  }

  // return a spreadable event handler object
  return eventHandlers
}
