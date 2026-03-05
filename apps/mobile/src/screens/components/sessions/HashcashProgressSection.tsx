import React, { memo } from 'react'
import { useSessionsDebugStore } from 'src/screens/stores/sessionsDebugStore'
import { Flex, Text } from 'ui/src'
import { useShallow } from 'zustand/shallow'

export const HashcashProgressSection = memo(function HashcashProgressSection(): JSX.Element | null {
  const progress = useSessionsDebugStore(
    useShallow((state) => ({
      isRunning: state.hashcashProgress.isRunning,
      difficulty: state.hashcashProgress.difficulty,
      estimatedAttempts: state.hashcashProgress.estimatedAttempts,
      elapsedMs: state.hashcashProgress.elapsedMs,
      actualResult: state.hashcashProgress.actualResult,
    })),
  )

  if (!progress.isRunning && !progress.actualResult) {
    return null
  }

  return (
    <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing8">
      <Text variant="subheading1">Hashcash Progress</Text>

      <Flex row justifyContent="space-between">
        <Text variant="body2" color="$neutral2">
          Status:
        </Text>
        <Text variant="body3" color={progress.isRunning ? '$accent1' : '$statusSuccess'}>
          {progress.isRunning ? 'Solving...' : 'Complete'}
        </Text>
      </Flex>

      <Flex row justifyContent="space-between">
        <Text variant="body2" color="$neutral2">
          Difficulty:
        </Text>
        <Text variant="body3" color="$neutral1">
          {progress.difficulty}
        </Text>
      </Flex>

      <Flex row justifyContent="space-between">
        <Text variant="body2" color="$neutral2">
          Attempts:
        </Text>
        <Text variant="body3" color="$neutral1">
          {progress.actualResult
            ? (progress.actualResult.iterationCount ?? 0).toLocaleString()
            : `~${progress.estimatedAttempts.toLocaleString()}`}
        </Text>
      </Flex>

      <Flex row justifyContent="space-between">
        <Text variant="body2" color="$neutral2">
          Time:
        </Text>
        <Text variant="body3" color="$neutral1">
          {progress.actualResult
            ? `${(progress.actualResult.durationMs / 1000).toFixed(2)}s`
            : `${(progress.elapsedMs / 1000).toFixed(2)}s`}
        </Text>
      </Flex>

      {progress.actualResult && (
        <Flex row justifyContent="space-between">
          <Text variant="body2" color="$neutral2">
            Hash Rate:
          </Text>
          <Text variant="body3" color="$neutral1">
            {((progress.actualResult.iterationCount ?? 0) / (progress.actualResult.durationMs / 1000)).toLocaleString(
              undefined,
              { maximumFractionDigits: 0 },
            )}{' '}
            h/s
          </Text>
        </Flex>
      )}
    </Flex>
  )
})
