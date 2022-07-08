import React, { PropsWithChildren } from 'react'
import { SyntheticEvent } from 'react'

import { sendAnalyticsEvent } from '.'
import { EventName, PartialActionProps } from './constants'
import { ITraceContext, Trace, TraceContext } from './Trace'

type TraceEventProps = {
  actionProps: PartialActionProps
  eventName: EventName
  eventProperties?: Record<string, unknown>
} & ITraceContext

/**
 * Telemetry instrumentation component that wraps event callbacks with logging logic.
 *
 * @example
 *  <TraceEvent actionProps={{ onClick: { action: 'click' }}} elementType='button'>
 *    <Button onClick={() => console.log('clicked')}>Click me</Button>
 *  </TraceEvent>
 */
function _TraceEvent(props: PropsWithChildren<TraceEventProps>) {
  const { eventName, eventProperties, actionProps, children, ...logEventProps } = props

  return (
    <Trace {...logEventProps}>
      <TraceContext.Consumer>
        {(consumedProps) =>
          React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) {
              return child
            }

            // For each child, augment event handlers defined in `actionProps`  with event tracing
            return React.cloneElement(
              child,
              getEventHandlers(child, consumedProps, actionProps, eventName, eventProperties)
            )
          })
        }
      </TraceContext.Consumer>
    </Trace>
  )
}

export const TraceEvent = React.memo(_TraceEvent)

function getKeys<T>(obj: T) {
  return Object.keys(obj) as Array<keyof T>
}

/**
 * Given a set of child element and action props, returns a spreadabble
 * object of the event handlers augmented with telemetry logging.
 */
function getEventHandlers(
  child: React.ReactElement,
  consumedProps: ITraceContext,
  actionProps: PartialActionProps,
  eventName: EventName,
  eventProperties?: Record<string, unknown>
) {
  const eventHandlers: Partial<Record<keyof PartialActionProps, (e: SyntheticEvent<Element, Event>) => void>> = {}

  for (const eventHandlerName of getKeys(actionProps)) {
    eventHandlers[eventHandlerName] = (eventHandlerArgs: unknown) => {
      // call child event handler with original arguments
      child.props[eventHandlerName]?.apply(child, eventHandlerArgs)

      // augment handler with analytics logging
      sendAnalyticsEvent(eventName, { ...consumedProps, ...eventProperties })
    }
  }

  // return a spreadable event handler object
  return eventHandlers
}
