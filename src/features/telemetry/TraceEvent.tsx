import React, { PropsWithChildren } from 'react'
import { GestureResponderEvent } from 'react-native-modal'
import { logEvent } from 'src/features/telemetry'
import { EventName, PartialActionProps } from 'src/features/telemetry/constants'
import { ITraceContext, Trace, TraceContext } from 'src/features/telemetry/Trace'
import { getKeys } from 'src/utils/objects'

type TraceEventProps = {
  actionProps: PartialActionProps
} & ITraceContext

/**
 * Telemetry instrumentation component that wraps event callbacks with logging logic.
 *
 * @example
 *  <TraceEvent actionProps={{ onPress: { action: 'press' }}} elementType='button'>
 *    <Button onPress={() => console.log('pressed')}>Push me</Button>
 *  </TraceEvent>
 */
function _TraceEvent(props: PropsWithChildren<TraceEventProps>) {
  const { elementType, actionProps, children, ...logEventProps } = props

  return (
    <Trace elementType={elementType} {...logEventProps}>
      <TraceContext.Consumer>
        {(consumedProps) =>
          React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) {
              return child
            }

            // For each child, augment event handlers defined in `actionProps`  with event tracing
            return React.cloneElement(child, getEventHandlers(child, consumedProps, actionProps))
          })
        }
      </TraceContext.Consumer>
    </Trace>
  )
}

export const TraceEvent = React.memo(_TraceEvent)

/**
 * Given a set of child element and action props, returns a spreadabble
 * object of the event handlers augmented with telemetry logging.
 */
function getEventHandlers(
  child: React.ReactElement,
  consumedProps: ITraceContext,
  actionProps: PartialActionProps
) {
  const eventHandlers: Partial<
    Record<keyof PartialActionProps, (e: GestureResponderEvent) => void>
  > = {}

  for (const eventHandlerName of getKeys(actionProps)) {
    eventHandlers[eventHandlerName] = (eventHandlerArgs: unknown) => {
      // call child event handler with original arguments
      child.props[eventHandlerName]?.apply(child, eventHandlerArgs)

      // augment handler with analytics logging
      logEvent(actionProps[eventHandlerName]?.action ?? EventName.UserEvent, {
        ...consumedProps,
        ...actionProps[eventHandlerName],
      })
    }
  }

  // return a spreadable event handler object
  return eventHandlers
}
