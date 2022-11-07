import { useDrawerStatus } from '@react-navigation/drawer'
import { useContext, useEffect, useMemo } from 'react'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName, SectionName } from 'src/features/telemetry/constants'
import { ITraceContext, TraceContext } from 'src/features/telemetry/Trace'

export function useTrace(trace?: ITraceContext): ITraceContext {
  const parentTrace = useContext(TraceContext)
  return useMemo(() => ({ ...parentTrace, ...trace }), [parentTrace, trace])
}

export function useDrawerStatusLogging() {
  const isDrawerOpen = useDrawerStatus() === 'open'

  useEffect(() => {
    if (isDrawerOpen) {
      sendAnalyticsEvent(EventName.Impression, { section: SectionName.Sidebar })
    }
  }, [isDrawerOpen])
}
