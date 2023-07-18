import { useFocusEffect } from '@react-navigation/core'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { memo, PropsWithChildren, ReactNode, useEffect, useMemo, useRef } from 'react'
import { useIsPartOfNavigationTree } from 'src/app/navigation/hooks'
import { shouldLogScreen } from 'src/components/telemetry/direct'
import { ITraceContext, TraceContext } from 'src/components/telemetry/TraceContext'
import { getEventHandlers } from 'src/components/telemetry/utils'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MarkNames, MobileEventName } from 'src/features/telemetry/constants'
import { useTrace } from 'src/features/telemetry/hooks'
import { logger } from 'wallet/src/features/logger/logger'

export type TraceProps = {
  // whether to log impression on mount
  logImpression?: boolean

  // whether to log a press on a click within the area
  logPress?: boolean
  // event to log if logging an event other than the default for press
  pressEvent?: MobileEventName

  // verifies an impression has come from that page directly to override the direct only skip list
  directFromPage?: boolean

  // additional properties to log with impression
  // (eg. TokenDetails Impression: { tokenAddress: 'address', tokenName: 'name' })
  properties?: Record<string, unknown>

  // registers a mark to later be measured
  startMark?: MarkNames
  // finalized mark measurements and logs duration between start and end mark timestamps
  endMark?: MarkNames
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
  startMark,
  endMark,
  properties,
}: PropsWithChildren<TraceProps>): JSX.Element {
  const initialRenderTimestamp = useRef<number>(Date.now())
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
      marks: startMark
        ? {
            ...parentTrace.marks,
            // progressively accumulate marks so they can later be measured
            [startMark]: initialRenderTimestamp.current,
          }
        : parentTrace.marks,
    }
  }, [parentTrace, startMark, screen, section, modal, element])

  // Log impression on mount for elements that are not part of the navigation tree
  useEffect(() => {
    if (logImpression && !isPartOfNavigationTree) {
      const eventProps = { ...combinedProps, ...properties }
      if (shouldLogScreen(directFromPage, (properties as ITraceContext | undefined)?.screen)) {
        sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, eventProps)
      }
    }
    // Impressions should only be logged on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logImpression, directFromPage])

  // Measure marks if needed
  useEffect(() => {
    if (!endMark) {
      return
    }

    const markStartTime = parentTrace.marks?.[endMark]
    if (!markStartTime) {
      return
    }

    const markDuration = Date.now() - markStartTime
    logger.info('telemetry', 'Trace', `${endMark}: ${markDuration}ms`)
  }, [combinedProps, endMark, parentTrace.marks])

  if (!isPartOfNavigationTree) {
    return <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
  }

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
  // Note: this does not register impressions when going back to a page from a modal
  useFocusEffect(
    React.useCallback(() => {
      if (logImpression) {
        const eventProps = { ...combinedProps, ...properties }
        if (shouldLogScreen(directFromPage, (properties as ITraceContext | undefined)?.screen)) {
          sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, eventProps)
        }
      }
    }, [combinedProps, directFromPage, logImpression, properties])
  )

  return <>{children}</>
}

export const Trace = memo(_Trace)
