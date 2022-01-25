import React, {
  createContext,
  memo,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { logEvent } from 'src/features/telemetry'
import { ElementName, EventName, ModalName, SectionName } from 'src/features/telemetry/constants'

export interface ITraceContext {
  screen?: string

  // Enclosed section name. Can be as wide or narrow as necessary to
  // provide telemetry context.
  section?: SectionName | ModalName

  // Element name mostly used to identify events sources
  // Does not need to be unique given the parent screen and section
  elementName?: ElementName | string
  elementType?: 'button'
}

export const TraceContext = createContext<ITraceContext>({})

type TraceProps = {
  logImpression?: boolean // whether to log impression on mount
} & ITraceContext

/**
 * Telemetry instrumentation component that combines parent telemetry context
 * with its own context to provide children a richer telemetry context.
 */
function _Trace({
  children,
  logImpression,
  screen,
  section,
  elementType,
  elementName,
}: PropsWithChildren<TraceProps>) {
  const [hasAlreadyLoggedImpression, setHasAlreadyLoggedImpression] = useState(false)
  const parentTrace = useContext(TraceContext)

  // Component props are destructured to ensure shallow comparison
  const combinedProps = useMemo(
    () => ({
      ...parentTrace,
      // removes `undefined` values
      ...JSON.parse(JSON.stringify({ screen, section, elementType, elementName })),
    }),
    [elementName, elementType, parentTrace, screen, section]
  )

  useEffect(() => {
    if (logImpression && !hasAlreadyLoggedImpression) {
      logEvent(EventName.Impression, combinedProps)
      setHasAlreadyLoggedImpression(true)
    }
  }, [combinedProps, hasAlreadyLoggedImpression, logImpression])

  return <TraceContext.Provider value={combinedProps}>{children}</TraceContext.Provider>
}

export const Trace = memo(_Trace)
