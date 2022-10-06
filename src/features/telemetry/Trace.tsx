import React, {
  createContext,
  memo,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { logEvent, logMessage } from 'src/features/telemetry'
import {
  ElementName,
  EventName,
  LogContext,
  MarkNames,
  ModalName,
  SectionName,
} from 'src/features/telemetry/constants'

export interface ITraceContext {
  screen?: string

  // Enclosed section name. Can be as wide or narrow as necessary to
  // provide telemetry context.
  section?: SectionName | ModalName

  // Element name mostly used to identify events sources
  // Does not need to be unique given the parent screen and section
  elementName?: ElementName | string
  elementType?: 'button' | 'switch'

  // Keeps track of start time for given marks
  marks?: Record<MarkNames, number>
}

export const TraceContext = createContext<ITraceContext>({})

type TraceProps = {
  logImpression?: boolean // whether to log impression on mount

  // registers a mark to later be measured
  startMark?: MarkNames
  // finalized mark measurements and logs duration between start and end mark timestamps
  endMark?: MarkNames
} & ITraceContext

/**
 * Telemetry instrumentation component that combines parent telemetry context
 * with its own context to provide children a richer telemetry context.
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
  elementType,
  elementName,
  startMark,
  endMark,
}: PropsWithChildren<TraceProps>) {
  const didLogImpression = useRef<boolean>(false)
  const initialRenderTimestamp = useRef<number>(Date.now())

  const parentTrace = useContext(TraceContext)

  // Component props are destructured to ensure shallow comparison
  const combinedProps = useMemo(
    () => ({
      ...parentTrace,
      // removes `undefined` values
      ...JSON.parse(
        JSON.stringify({
          screen,
          section,
          elementType,
          elementName,
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
    [elementName, elementType, parentTrace, startMark, screen, section]
  )

  // Log impression if needed
  useEffect(() => {
    if (logImpression && !didLogImpression.current) {
      logEvent(EventName.Impression, combinedProps)
      didLogImpression.current = true
    }
  }, [combinedProps, logImpression])

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
    logMessage(LogContext.Marks, `${endMark}: ${markDuration}ms`)
  }, [combinedProps, endMark, parentTrace.marks])

  return <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
}

export const Trace = memo(_Trace)
