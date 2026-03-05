import React, { memo } from 'react'
import { useHashcashBenchmarkStore } from 'src/screens/stores/hashcashBenchmarkStore'
import { Flex, Text } from 'ui/src'
import { useShallow } from 'zustand/shallow'

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export const ProgressSection = memo(function ProgressSection(): JSX.Element | null {
  const progress = useHashcashBenchmarkStore(
    useShallow((state) => ({
      isRunning: state.progress.isRunning,
      currentImpl: state.progress.currentImpl,
      difficulty: state.progress.difficulty,
      startTime: state.progress.startTime,
      elapsedMs: state.progress.elapsedMs,
      estimatedAttempts: state.progress.estimatedAttempts,
    })),
  )

  if (!progress.isRunning) {
    return null
  }

  return (
    <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing8">
      <Text variant="subheading1">Current Progress</Text>

      <Flex row justifyContent="space-between">
        <Text variant="body2" color="$neutral2">
          Running:
        </Text>
        <Text variant="body3" color="$accent1">
          {progress.currentImpl === 'native' ? 'Native' : 'JavaScript'} @ Difficulty {progress.difficulty}
        </Text>
      </Flex>

      {progress.startTime !== null ? (
        <>
          <Flex row justifyContent="space-between">
            <Text variant="body2" color="$neutral2">
              Elapsed:
            </Text>
            <Text variant="body3" color="$neutral1">
              {formatDuration(progress.elapsedMs)}
            </Text>
          </Flex>

          <Flex row justifyContent="space-between">
            <Text variant="body2" color="$neutral2">
              Est. Attempts:
            </Text>
            <Text variant="body3" color="$neutral1">
              ~{progress.estimatedAttempts.toLocaleString()}
            </Text>
          </Flex>
        </>
      ) : (
        <Text variant="body3" color="$neutral3">
          JS blocks main thread - no progress updates
        </Text>
      )}
    </Flex>
  )
})
