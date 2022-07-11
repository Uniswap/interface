import { createContext, memo, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

import { sendAnalyticsEvent } from '.'
import { ElementName, EventName, ModalName, PageName, SectionName } from './constants'

export interface ITraceContext {
  // Highest order context: eg Swap or Explore.
  page?: PageName

  // Enclosed section name. Can be as wide or narrow as necessary to
  // provide context.
  section?: SectionName | ModalName

  // Element name mostly used to identify events sources
  // Does not need to be unique given the higher order page and section.
  element?: ElementName
}

export const TraceContext = createContext<ITraceContext>({})

type TraceProps = {
  shouldLogImpression?: boolean // whether to log impression on mount
  eventName?: EventName
  eventProperties?: Record<string, unknown>
} & ITraceContext

/**
 * Sends an analytics event on mount (if shouldLogImpression is set),
 * and propagates the context to child traces.
 */
export const Trace = memo(
  ({
    children,
    shouldLogImpression,
    page,
    section,
    element,
    eventName,
    eventProperties,
  }: PropsWithChildren<TraceProps>) => {
    const [hasAlreadyLoggedImpression, setHasAlreadyLoggedImpression] = useState(false)
    const parentTrace = useContext(TraceContext)

    // Component props are destructured to ensure shallow comparison
    const combinedProps = useMemo(
      () => ({
        ...parentTrace,
        ...Object.fromEntries(Object.entries({ page, section, element }).filter(([_, v]) => v !== undefined)),
      }),
      [element, parentTrace, page, section]
    )

    useEffect(() => {
      if (shouldLogImpression && !hasAlreadyLoggedImpression) {
        sendAnalyticsEvent(eventName ?? EventName.PAGE_VIEWED, { ...combinedProps, ...eventProperties })
        setHasAlreadyLoggedImpression(true)
      }
    }, [combinedProps, hasAlreadyLoggedImpression, shouldLogImpression, eventName, eventProperties])

    return <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
  }
)

Trace.displayName = 'Trace'
