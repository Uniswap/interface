import { useFocusEffect } from '@react-navigation/core'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { memo, PropsWithChildren, ReactNode, useEffect, useMemo } from 'react'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { useAnalyticsNavigationContext } from './AnalyticsNavigationContext'
import { ITraceContext, TraceContext, useTrace } from './TraceContext'
import { getEventHandlers } from './utils'

export type TraceProps = {
  // whether to log impression on mount
  logImpression?: boolean

  // whether to log a press on a click within the area
  logPress?: boolean
  // event to log if logging an event other than the default for press
  pressEvent?: string

  // verifies an impression has come from that page directly to override the direct only skip list
  directFromPage?: boolean

  // additional properties to log with impression
  // (eg. TokenDetails Impression: { tokenAddress: 'address', tokenName: 'name' })
  properties?: Record<string, unknown>
} & ITraceContext

function _Trace({
  children,
  logImpression,
  pressEvent,
  logPress,
  directFromPage,
  screen,
  section,
  element,
  modal,
  properties,
}: PropsWithChildren<TraceProps>): JSX.Element {
  const { useIsPartOfNavigationTree, shouldLogScreen: shouldLogScreen } =
    useAnalyticsNavigationContext()
  const isPartOfNavigationTree = useIsPartOfNavigationTree()

  const parentTrace = useTrace()

  // Component props are destructured to ensure shallow comparison
  const combinedProps = useMemo(() => {
    // removes `undefined` values
    const filteredProps = {
      ...(screen ? { screen } : {}),
      ...(section ? { section } : {}),
      ...(modal ? { modal } : {}),
      ...(element ? { element } : {}),
    }

    return {
      ...parentTrace,
      ...filteredProps,
    }
  }, [parentTrace, screen, section, modal, element])

  // Log impression on mount for elements that are not part of the navigation tree
  useEffect(() => {
    if (logImpression && !isPartOfNavigationTree) {
      const eventProps = { ...combinedProps, ...properties }
      if (shouldLogScreen(directFromPage, (properties as ITraceContext | undefined)?.screen)) {
        analytics.sendEvent(SharedEventName.PAGE_VIEWED, eventProps)
      }
    }
    // Impressions should only be logged on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logImpression, directFromPage])

  const modifiedChildren = logPress ? (
    <TraceContext.Consumer>
      {(consumedProps): ReactNode =>
        React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) {
            return child
          }

          // For each child, augment event handlers defined in `actionProps`  with event tracing
          return React.cloneElement(
            child,
            getEventHandlers(
              child,
              consumedProps,
              pressEvent ?? SharedEventName.ELEMENT_CLICKED,
              element,
              properties
            )
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
      properties={properties}>
      <TraceContext.Provider value={combinedProps}>{modifiedChildren}</TraceContext.Provider>
    </NavAwareTrace>
  )
}

type NavAwareTraceProps = Pick<TraceProps, 'logImpression' | 'properties' | 'directFromPage'>

// Internal component to keep track of navigation events
// Needed since we need to rely on `navigation.useFocusEffect` to track
// impressions of pages that are not unmounted when navigating away from them
function NavAwareTrace({
  logImpression,
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
          analytics.sendEvent(SharedEventName.PAGE_VIEWED, eventProps)
        }
      }
    }, [combinedProps, directFromPage, logImpression, properties, shouldLogScreen])
  )

  return <>{children}</>
}

export const Trace = memo(_Trace)
