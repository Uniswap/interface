import { useFocusEffect } from '@react-navigation/core'
import { BrowserEvent, SharedEventName } from '@uniswap/analytics-events'
import React, { memo, PropsWithChildren, ReactNode, useEffect, useId, useMemo } from 'react'
import { isWebPlatform } from 'utilities/src/platform'
// biome-ignore lint/style/noRestrictedImports: Platform-specific implementation needs internal types
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { useAnalyticsNavigationContext } from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
import { ITraceContext, TraceContext, useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getEventHandlers } from 'utilities/src/telemetry/trace/utils'

function getEventsFromProps({
  logPress = false,
  logFocus = false,
  logKeyPress = false,
}: {
  logPress?: boolean
  logFocus?: boolean
  logKeyPress?: boolean
}): string[] {
  const events = []
  if (logPress) {
    events.push(isWebPlatform ? 'onClick' : 'onPress')
  }
  if (logFocus) {
    events.push(BrowserEvent.onFocus)
  }
  if (logKeyPress) {
    events.push(BrowserEvent.onKeyPress)
  }
  return events
}

export type TraceProps = {
  // whether to log impression on mount
  logImpression?: boolean

  // whether to log a press on a click within the area
  logPress?: boolean

  // whether to log a focus on this element
  logFocus?: boolean

  // whether to log a key press
  logKeyPress?: boolean

  // event to log if logging an event other than the default for press
  eventOnTrigger?: string

  // verifies an impression has come from that page directly to override the direct only skip list
  directFromPage?: boolean

  // additional properties to log with impression
  // (eg. TokenDetails Impression: { tokenAddress: 'address', tokenName: 'name' })
  properties?: Record<string, unknown>
}

// only used for avoiding double logging in development
const devDoubleLogDisableMap: Record<string, boolean> = {}

function _Trace({
  children,
  logImpression,
  eventOnTrigger,
  logPress,
  logFocus,
  logKeyPress,
  directFromPage,
  screen,
  page,
  section,
  element,
  modal,
  properties,
}: PropsWithChildren<TraceProps & ITraceContext>): JSX.Element {
  const id = useId()

  const { useIsPartOfNavigationTree, shouldLogScreen: shouldLogScreen } = useAnalyticsNavigationContext()
  const isPartOfNavigationTree = useIsPartOfNavigationTree()
  const parentTrace = useTrace()

  const events = useMemo(() => {
    return getEventsFromProps({ logPress, logFocus, logKeyPress })
  }, [logFocus, logKeyPress, logPress])

  // Component props are destructured to ensure shallow comparison
  const combinedProps = useMemo(() => {
    // removes `undefined` values
    const filteredProps = {
      ...(screen ? { screen } : {}),
      ...(page ? { page } : {}),
      ...(section ? { section } : {}),
      ...(modal ? { modal } : {}),
      ...(element ? { element } : {}),
    }

    return {
      ...parentTrace,
      ...filteredProps,
    }
  }, [parentTrace, screen, section, modal, element, page])

  // Log impression on mount for elements that are not part of the navigation tree
  // biome-ignore lint/correctness/useExhaustiveDependencies: Impressions should only be logged on mount
  useEffect(() => {
    if (!devDoubleLogDisableMap[id] && logImpression && !isPartOfNavigationTree) {
      if (shouldLogScreen(directFromPage, (properties as ITraceContext | undefined)?.screen)) {
        // Log the event
        const eventProps = { ...combinedProps, ...properties }
        analytics.sendEvent(eventOnTrigger ?? SharedEventName.PAGE_VIEWED, eventProps)

        // In development for web, ensure we don't double log impressions due to strict mode
        if (__DEV__) {
          devDoubleLogDisableMap[id] = true
          setTimeout(() => {
            devDoubleLogDisableMap[id] = false
          }, 50)
        }
      }
    }
  }, [logImpression])

  const modifiedChildren =
    events.length > 0 ? (
      <TraceContext.Consumer>
        {(consumedProps): ReactNode =>
          React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) {
              return child
            }

            // For each child, augment event handlers defined in `actionProps` with event tracing
            return React.cloneElement(
              child,
              getEventHandlers({
                child,
                consumedProps,
                triggers: events,
                eventName: eventOnTrigger ?? SharedEventName.ELEMENT_CLICKED,
                element,
                properties,
              }),
            )
          })
        }
      </TraceContext.Consumer>
    ) : (
      children
    )

  if (!isPartOfNavigationTree) {
    return <TraceContext.Provider value={combinedProps}>{modifiedChildren}</TraceContext.Provider>
  }

  return (
    <NavAwareTrace
      combinedProps={combinedProps}
      directFromPage={directFromPage}
      logImpression={logImpression}
      properties={properties}
    >
      <TraceContext.Provider value={combinedProps}>{modifiedChildren}</TraceContext.Provider>
    </NavAwareTrace>
  )
}

type NavAwareTraceProps = Pick<TraceProps, 'logImpression' | 'properties' | 'directFromPage' | 'eventOnTrigger'>

// Internal component to keep track of navigation events
// Needed since we need to rely on `navigation.useFocusEffect` to track
// impressions of pages that are not unmounted when navigating away from them
function NavAwareTrace({
  logImpression,
  eventOnTrigger,
  directFromPage,
  combinedProps,
  children,
  properties,
}: { combinedProps: ITraceContext } & PropsWithChildren<NavAwareTraceProps>): JSX.Element {
  const { shouldLogScreen } = useAnalyticsNavigationContext()
  // Note: this does not register impressions when going back to a page from a modal
  useFocusEffect(
    React.useCallback(() => {
      if (logImpression) {
        const eventProps = { ...combinedProps, ...properties }
        if (shouldLogScreen(directFromPage, (properties as ITraceContext | undefined)?.screen)) {
          analytics.sendEvent(eventOnTrigger ?? SharedEventName.PAGE_VIEWED, eventProps)
        }
      }
    }, [combinedProps, directFromPage, eventOnTrigger, logImpression, properties, shouldLogScreen]),
  )

  return <>{children}</>
}

export const Trace = memo(_Trace)
