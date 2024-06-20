import { createContext, memo, PropsWithChildren, useContext, useEffect, useMemo } from 'react'

import { analyticsConfig, sendAnalyticsEvent } from '.'

const DEFAULT_EVENT = 'Page Viewed'

export interface ITraceContext {
  // Highest order context: eg Swap or Explore.
  page?: string

  // Enclosed section name. For contexts with modals, refers to the
  // section of the page from which the user triggered the modal.
  section?: string

  modal?: string

  // Element name mostly used to identify events sources
  // Does not need to be unique given the higher order page and section.
  element?: string
}

export const TraceContext = createContext<ITraceContext>({})

export function useTrace(trace?: ITraceContext): ITraceContext {
  const parentTrace = useContext(TraceContext)
  return useMemo(() => ({ ...parentTrace, ...trace }), [parentTrace, trace])
}

type TraceProps = {
  shouldLogImpression?: boolean // whether to log impression on mount
  name?: string
  properties?: Record<string, unknown>
} & ITraceContext

/**
 * Sends an analytics event on mount or if `shouldLogImpression` toggles,
 * and propagates the context to child traces.
 *
 * It defaults to logging an EventName.PAGE_VIEWED if no `name` is provided.
 */
export const Trace = memo(
  ({
    shouldLogImpression,
    name,
    children,
    page,
    section,
    modal,
    element,
    properties,
  }: PropsWithChildren<TraceProps>) => {
    const parentTrace = useTrace()

    const combinedProps = useMemo(
      () => ({
        ...parentTrace,
        ...Object.fromEntries(
          Object.entries({ page, section, modal, element }).filter(([_, v]) => v !== undefined)
        ),
      }),
      [element, parentTrace, page, modal, section]
    )

    useEffect(() => {
      if (shouldLogImpression) {
        // If an event name is not provided, fallback to the config defaultEventName, otherwise local default
        sendAnalyticsEvent(name ?? analyticsConfig?.defaultEventName ?? DEFAULT_EVENT, {
          ...combinedProps,
          ...properties,
          git_commit_hash: analyticsConfig?.commitHash,
        })
      }
      // Impressions should only be logged on mount or if `shouldLogImpression` toggles
      // (ie if the component becomes "viewed"), but not if/when other deps update.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldLogImpression])

    return <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
  }
)

Trace.displayName = 'Trace'
