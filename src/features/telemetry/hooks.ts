import { useContext, useMemo } from 'react'
import { ITraceContext, TraceContext } from 'src/components/telemetry/Trace'

export function useTrace(trace?: ITraceContext): ITraceContext {
  const parentTrace = useContext(TraceContext)
  return useMemo(() => ({ ...parentTrace, ...trace }), [parentTrace, trace])
}
