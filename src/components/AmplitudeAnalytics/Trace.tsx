import { createContext, memo, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

import { sendAnalyticsEvent } from '.'
import { ElementName, EventName, ModalName, PageName, SectionName } from './constants'

export interface ITraceContext {
  // Page name, such as Swap or Explore page. Highest order context.
  page?: PageName

  // Enclosed section name. Can be as wide or narrow as necessary to
  // provide context.
  section?: SectionName | ModalName

  // Element name mostly used to identify events sources
  // Does not need to be unique given the higher order page and section.
  elementName?: ElementName | string
}

export const TraceContext = createContext<ITraceContext>({})

type TraceProps = {
  logImpression?: boolean // whether to log impression on mount
  eventName?: EventName
} & ITraceContext

/**
 * Analytics instrumentation component that combines parent context
 * with its own context.
 */
function _Trace({ children, logImpression, page, section, elementName, eventName }: PropsWithChildren<TraceProps>) {
  const [hasAlreadyLoggedImpression, setHasAlreadyLoggedImpression] = useState(false)
  const parentTrace = useContext(TraceContext)

  // Component props are destructured to ensure shallow comparison
  const combinedProps = useMemo(
    () => ({
      ...parentTrace,
      // removes `undefined` values
      ...JSON.parse(JSON.stringify({ page, section, elementName })),
    }),
    [elementName, parentTrace, page, section]
  )

  useEffect(() => {
    if (logImpression && !hasAlreadyLoggedImpression) {
      sendAnalyticsEvent(eventName ?? EventName.PAGE_VIEWED, combinedProps)
      setHasAlreadyLoggedImpression(true)
    }
  }, [combinedProps, hasAlreadyLoggedImpression, logImpression, eventName])

  return <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
}

export const Trace = memo(_Trace)
