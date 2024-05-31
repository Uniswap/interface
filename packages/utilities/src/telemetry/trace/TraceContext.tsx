import { createContext, useContext, useMemo } from 'react'

export interface ITraceContext {
  // Hierarchical context of where an element is
  page?: string
  screen?: string
  section?: string
  modal?: string
  element?: string
}

export const TraceContext = createContext<ITraceContext>({})

export function useTrace(trace?: ITraceContext): ITraceContext {
  const parentTrace = useContext(TraceContext)
  return useMemo(() => ({ ...parentTrace, ...trace }), [parentTrace, trace])
}
