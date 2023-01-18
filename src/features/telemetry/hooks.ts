import { useDrawerStatus } from '@react-navigation/drawer'
import { useContext, useEffect, useMemo } from 'react'
import { ITraceContext, TraceContext } from 'src/components/telemetry/Trace'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName, SectionName } from 'src/features/telemetry/constants'

export function useTrace(trace?: ITraceContext): ITraceContext {
  const parentTrace = useContext(TraceContext)
  return useMemo(() => ({ ...parentTrace, ...trace }), [parentTrace, trace])
}

export function useDrawerStatusLogging(): void {
  const isDrawerOpen = useDrawerStatus() === 'open'

  useEffect(() => {
    if (isDrawerOpen) {
      sendAnalyticsEvent(EventName.Impression, { section: SectionName.Sidebar })
    }
  }, [isDrawerOpen])
}
