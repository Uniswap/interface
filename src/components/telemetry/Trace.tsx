import { useFocusEffect } from '@react-navigation/core'
import React, { createContext, memo, PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { useIsPartOfNavigationTree } from 'src/app/navigation/hooks'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName, MarkNames, ModalName, SectionName } from 'src/features/telemetry/constants'
import { useTrace } from 'src/features/telemetry/hooks'
import { AppScreen } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'

export interface ITraceContext {
  screen?: AppScreen

  // Enclosed section name. Can be as wide or narrow as necessary to
  // provide telemetry context.
  section?: SectionName

  modal?: ModalName

  // Keeps track of start time for given marks
  marks?: Record<MarkNames, number>
}

export const TraceContext = createContext<ITraceContext>({})

export type TraceProps = {
  logImpression?: boolean // whether to log impression on mount

  // additional properties to log with impression
  // (eg. TokenDetails Impression: { tokenAddress: 'address', tokenName: 'name' })
  properties?: Record<string, unknown>

  // registers a mark to later be measured
  startMark?: MarkNames
  // finalized mark measurements and logs duration between start and end mark timestamps
  endMark?: MarkNames
} & ITraceContext

/**
 * Telemetry instrumentation component that combines parent telemetry context
 * with its own context to provide children a richer telemetry context (eg Screen, Section, Modal, Element)
 *
 * Optionally can also log an “impression” event to analytics
 * (eg: Page Viewed, Modal Opened type of events that indicate the User has seen this component).
 *
 * Marks: inspired by Web Performance API
 * @example
 *  // Track start timestamp with a mark
 *  <Trace startMark={Marks.Rehydration}>
 *    ...
 *    // Log end timestamp for that mark
 *    <Trace endMark={Marks.Rehydration}>
 *      ...
 *    </Trace>
 * </Trace>
 */
function _Trace({
  children,
  logImpression,
  screen,
  section,
  modal,
  startMark,
  endMark,
  properties,
}: PropsWithChildren<TraceProps>): JSX.Element {
  const initialRenderTimestamp = useRef<number>(Date.now())
  const isPartOfNavigationTree = useIsPartOfNavigationTree()

  const parentTrace = useTrace()

  // Component props are destructured to ensure shallow comparison
  const combinedProps = useMemo(
    () => ({
      ...parentTrace,
      // removes `undefined` values
      ...JSON.parse(
        JSON.stringify({
          screen,
          section,
          modal,
        })
      ),
      marks: startMark
        ? {
            ...parentTrace.marks,
            // progressively accumulate marks so they can later be measured
            [startMark]: initialRenderTimestamp.current,
          }
        : parentTrace.marks,
    }),
    [parentTrace, startMark, screen, section, modal]
  )

  // Log impression on mount for elements that are not part of the navigation tree
  useEffect(() => {
    if (logImpression && !isPartOfNavigationTree) {
      sendAnalyticsEvent(EventName.Impression, { ...combinedProps, ...properties })
    }
    // Impressions should only be logged on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logImpression])

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

  return (
    <NavAwareTrace
      combinedProps={combinedProps}
      logImpression={logImpression}
      properties={properties}>
      <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
    </NavAwareTrace>
  )
}

type NavAwareTraceProps = Pick<TraceProps, 'logImpression' | 'properties'>

// Internal component to keep track of navigation events
// Needed since we need to rely on `navigation.useFocusEffect` to track
// impressions of pages that are not unmounted when navigating away from them
function NavAwareTrace({
  logImpression,
  combinedProps,
  children,
  properties,
}: { combinedProps: ITraceContext } & PropsWithChildren<NavAwareTraceProps>) {
  // this still doesn't captures navigating back from modals
  // analysis will need to be done on the backend to determine the last screen impression
  useFocusEffect(
    React.useCallback(() => {
      if (logImpression) {
        sendAnalyticsEvent(EventName.Impression, { ...combinedProps, ...properties })
      }
    }, [combinedProps, logImpression, properties])
  )

  return <>{children}</>
}

export const Trace = memo(_Trace)
