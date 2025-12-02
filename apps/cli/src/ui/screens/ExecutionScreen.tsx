import type { OrchestratorConfig } from '@universe/cli/src/core/orchestrator'
import type { ProgressEventType } from '@universe/cli/src/lib/logger'
import { ProgressIndicator } from '@universe/cli/src/ui/components/ProgressIndicator'
import { StatusBadge } from '@universe/cli/src/ui/components/StatusBadge'
import { useAnalysis } from '@universe/cli/src/ui/hooks/useAnalysis'
import { useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { useEffect, useRef, useState } from 'react'

interface ExcerptItem {
  message: string
  isReasoning?: boolean
  eventType?: ProgressEventType
}

interface ExecutionScreenProps {
  config: OrchestratorConfig
  onComplete: (results: Record<string, unknown>) => void
  onError: (error: Error) => void
}

export function ExecutionScreen({ config, onComplete, onError }: ExecutionScreenProps): JSX.Element {
  const { execute, progress, error, isRunning } = useAnalysis()
  const { dispatch } = useAppState()
  const hasExecutedRef = useRef(false)
  const configRef = useRef<OrchestratorConfig | null>(null)
  const [excerpts, setExcerpts] = useState<ExcerptItem[]>([])
  const excerptsRef = useRef<ExcerptItem[]>([])

  useEffect(() => {
    // Guard: Only execute once per config change
    // Check if config has actually changed by comparing a stable reference
    const configString = JSON.stringify(config)
    const previousConfigString = configRef.current ? JSON.stringify(configRef.current) : null

    if (hasExecutedRef.current && configString === previousConfigString) {
      return
    }

    // Guard: Don't execute if already running
    if (isRunning) {
      return
    }

    hasExecutedRef.current = true
    configRef.current = config

    dispatch({ type: 'SET_EXECUTION_STATE', state: 'running' })
    execute(config)
      .then((results: Record<string, unknown> | null) => {
        if (results) {
          dispatch({ type: 'SET_EXECUTION_STATE', state: 'complete' })
          onComplete(results)
        }
      })
      .catch((err: unknown) => {
        dispatch({ type: 'SET_EXECUTION_STATE', state: 'error' })
        onError(err instanceof Error ? err : new Error(String(err)))
      })
  }, [config, execute, dispatch, onComplete, onError, isRunning])

  // Track streaming excerpts during analysis
  useEffect(() => {
    if (progress?.stage === 'analyzing' && progress.message) {
      // Only add excerpts that look like agent thinking/output (not stage transitions)
      const message = progress.message.trim()

      // Filter out unwanted content - be more aggressive
      const isUnwanted =
        message.includes('Analyzing with') ||
        message.includes('Running analysis') ||
        message.startsWith('##') || // Markdown headers
        message === '...' || // Just ellipsis
        message.length < 100 || // Increase threshold to filter out short fragments
        /^[.\s]*$/.test(message) // Only dots and whitespace

      if (!isUnwanted) {
        // Check for duplicates - be more aggressive about similarity detection
        const isDuplicate = excerptsRef.current.some((existing) => {
          const existingMsg = existing.message

          // Check if new message overlaps significantly with existing
          if (existingMsg.length === 0 || message.length === 0) {
            return false
          }

          // Check if they start the same (exact duplicate start) - increased threshold
          if (existingMsg.slice(0, 80) === message.slice(0, 80)) {
            return true
          }

          // Check if one contains a significant portion of the other (more aggressive)
          const shorterLength = Math.min(existingMsg.length, message.length)
          const comparisonLength = Math.min(100, Math.floor(shorterLength * 0.6))

          if (comparisonLength > 0) {
            const existingStart = existingMsg.slice(0, comparisonLength)
            const messageStart = message.slice(0, comparisonLength)

            if (message.includes(existingStart) || existingMsg.includes(messageStart)) {
              return true
            }
          }

          return false
        })

        if (!isDuplicate) {
          // Create excerpt item with metadata
          const newExcerpt: ExcerptItem = {
            message,
            isReasoning: progress.isReasoning,
            eventType: progress.eventType || (progress.isReasoning ? 'reasoning' : 'output'),
          }

          // Keep only the latest excerpt (replace previous)
          excerptsRef.current = [newExcerpt]
          setExcerpts([newExcerpt])
        }
      }
    } else if (progress?.stage !== 'analyzing') {
      // Clear excerpts when not analyzing
      excerptsRef.current = []
      setExcerpts([])
    }
  }, [progress])

  const currentStage = progress?.stage || 'idle'

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={2}>
        <Text bold color={colors.primary}>
          Generating Changelog
        </Text>
      </Box>
      <Box flexDirection="column">
        {isRunning && (
          <>
            <Text>
              <Spinner type="dots" /> Running analysis...
            </Text>
            <Box marginTop={1}>
              <ProgressIndicator
                currentStage={currentStage}
                message={progress?.eventType === 'info' ? progress.message : undefined}
                cacheInfo={progress?.cacheInfo}
              />
            </Box>
            {currentStage === 'analyzing' && excerpts.length > 0 && excerpts[0] && (
              <Box marginTop={1}>
                <Text dimColor color="gray">
                  {excerpts[0].message.length > 140 ? `${excerpts[0].message.slice(0, 140)}...` : excerpts[0].message}
                </Text>
              </Box>
            )}
          </>
        )}

        {error && (
          <Text>
            <StatusBadge type="error">Error: {error.message}</StatusBadge>
          </Text>
        )}

        {!isRunning && !error && progress?.stage === 'complete' && (
          <Text>
            <StatusBadge type="success">Analysis complete!</StatusBadge>
          </Text>
        )}
      </Box>
    </Box>
  )
}
