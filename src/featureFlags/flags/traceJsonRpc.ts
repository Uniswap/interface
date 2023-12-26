import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useTraceJsonRpcFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.traceJsonRpc)
}

export { BaseVariant as TraceJsonRpcVariant }
