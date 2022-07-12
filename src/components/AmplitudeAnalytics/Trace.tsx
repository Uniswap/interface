import { createContext, memo, PropsWithChildren, useContext, useEffect, useMemo } from 'react'

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
  name?: EventName
  properties?: Record<string, unknown>
} & ITraceContext

/**
 * Sends an analytics event on mount (if shouldLogImpression is set),
 * and propagates the context to child traces.
 */
export const Trace = memo(
  ({ shouldLogImpression, name, children, page, section, element, properties }: PropsWithChildren<TraceProps>) => {
    const parentTrace = useContext(TraceContext)

    const combinedProps = useMemo(
      () => ({
        ...parentTrace,
        ...Object.fromEntries(Object.entries({ page, section, element }).filter(([_, v]) => v !== undefined)),
      }),
      [element, parentTrace, page, section]
    )

    useEffect(() => {
      if (shouldLogImpression) {
        sendAnalyticsEvent(name ?? EventName.PAGE_VIEWED, { ...combinedProps, ...properties })
      }
      // Impressions should only be logged on mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
  }
)

Trace.displayName = 'Trace'
