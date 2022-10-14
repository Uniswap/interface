import { createContext, memo, PropsWithChildren, useContext, useEffect, useMemo } from 'react'

import { sendAnalyticsEvent } from '.'
import { ElementName, EventName, ModalName, PageName, SectionName } from './constants'

export interface ITraceContext {
  // Highest order context: eg Swap or Explore.
  page?: PageName

  // Enclosed section name. For contexts with modals, refers to the
  // section of the page from which the user triggered the modal.
  section?: SectionName

  modal?: ModalName

  // Element name mostly used to identify events sources
  // Does not need to be unique given the higher order page and section.
  element?: ElementName
}

export const TraceContext = createContext<ITraceContext>({})

export function useTrace(trace?: ITraceContext): ITraceContext {
  const parentTrace = useContext(TraceContext)
  return useMemo(() => ({ ...parentTrace, ...trace }), [parentTrace, trace])
}

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
        ...Object.fromEntries(Object.entries({ page, section, modal, element }).filter(([_, v]) => v !== undefined)),
      }),
      [element, parentTrace, page, modal, section]
    )

    useEffect(() => {
      if (shouldLogImpression) {
        const commitHash = process.env.REACT_APP_GIT_COMMIT_HASH
        sendAnalyticsEvent(name ?? EventName.PAGE_VIEWED, {
          ...combinedProps,
          ...properties,
          git_commit_hash: commitHash,
        })
      }
      // Impressions should only be logged on mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
  }
)

Trace.displayName = 'Trace'
