import type { OrchestratorConfig } from '@universe/cli/src/core/orchestrator'
import { OrchestratorService, type ProgressEvent } from '@universe/cli/src/ui/services/orchestrator-service'
import { useCallback, useState } from 'react'

interface UseAnalysisResult {
  execute: (config: OrchestratorConfig) => Promise<Record<string, unknown> | null>
  results: Record<string, unknown> | null
  progress: ProgressEvent | null
  error: Error | null
  isRunning: boolean
}

export function useAnalysis(): UseAnalysisResult {
  const [results, setResults] = useState<Record<string, unknown> | null>(null)
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [service] = useState(() => new OrchestratorService())

  const execute = useCallback(
    async (config: OrchestratorConfig): Promise<Record<string, unknown> | null> => {
      try {
        setIsRunning(true)
        setError(null)
        setProgress({ stage: 'idle' })
        setResults(null)

        const result = await service.execute(config, (event: ProgressEvent) => {
          setProgress(event)
        })

        setResults(result)
        setIsRunning(false)
        return result
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        setIsRunning(false)
        setProgress({ stage: 'error', message: errorObj.message })
        return null
      }
    },
    [service],
  )

  return {
    execute,
    results,
    progress,
    error,
    isRunning,
  }
}
