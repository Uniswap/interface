import React, { memo } from 'react'
import type { BenchmarkResult } from 'src/screens/stores/hashcashBenchmarkStore'
import { Flex, Text } from 'ui/src'

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export const ResultCard = memo(function ResultCard({
  difficulty,
  native,
  js,
}: {
  difficulty: string
  native: BenchmarkResult | undefined
  js: BenchmarkResult | undefined
}): JSX.Element {
  const speedup = native && js ? js.timeMs / native.timeMs : null

  return (
    <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing12">
      <Text variant="subheading1">Difficulty {difficulty}</Text>

      {native && (
        <Flex gap="$spacing4">
          <Flex row justifyContent="space-between">
            <Text variant="body2" fontWeight="600" color="$statusSuccess">
              Native
            </Text>
            <Text variant="body3" color="$neutral2">
              {formatDuration(native.timeMs)}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              Attempts:
            </Text>
            <Text variant="body3" color="$neutral1">
              {native.attempts.toLocaleString()}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              Hash Rate:
            </Text>
            <Text variant="body3" color="$neutral1">
              {native.hashRate.toLocaleString()} h/s
            </Text>
          </Flex>
        </Flex>
      )}

      {js && (
        <Flex gap="$spacing4">
          <Flex row justifyContent="space-between">
            <Text variant="body2" fontWeight="600" color="$neutral1">
              JavaScript
            </Text>
            <Text variant="body3" color="$neutral2">
              {formatDuration(js.timeMs)}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              Attempts:
            </Text>
            <Text variant="body3" color="$neutral1">
              {js.attempts.toLocaleString()}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              Hash Rate:
            </Text>
            <Text variant="body3" color="$neutral1">
              {js.hashRate.toLocaleString()} h/s
            </Text>
          </Flex>
        </Flex>
      )}

      {speedup && (
        <Flex backgroundColor="$surface3" p="$spacing8" borderRadius="$rounded8">
          <Text
            variant="body2"
            fontWeight="bold"
            color={speedup > 1 ? '$statusSuccess' : '$statusCritical'}
            textAlign="center"
          >
            {speedup > 1 ? `Native is ${speedup.toFixed(1)}x faster` : `JS is ${(1 / speedup).toFixed(1)}x faster`}
          </Text>
        </Flex>
      )}
    </Flex>
  )
})
