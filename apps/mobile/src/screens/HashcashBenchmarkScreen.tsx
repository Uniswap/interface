import { HashcashNative } from '@universe/hashcash-native'
import { findProof as jsFindProof } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { ScrollView } from 'react-native'
import { BackButton } from 'src/components/buttons/BackButton'
import { Screen } from 'src/components/layout/Screen'
import { LogSection } from 'src/screens/components/hashcash/LogSection'
import { ProgressSection } from 'src/screens/components/hashcash/ProgressSection'
import { ResultCard } from 'src/screens/components/hashcash/ResultCard'
import {
  type BenchmarkResult,
  type Implementation,
  useHashcashBenchmarkStore,
} from 'src/screens/stores/hashcashBenchmarkStore'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

const DIFFICULTIES = [1, 2, 3, 4, 5]

/**
 * Wait for React to render and the native layer to paint.
 * Uses double requestAnimationFrame - first frame commits React changes,
 * second frame ensures paint has happened.
 */
const waitForPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

const IMPLEMENTATIONS: { value: Implementation; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'native', label: 'Native' },
  { value: 'js', label: 'JS' },
]

// Memoized difficulty selector button
const DifficultyButton = memo(function DifficultyButton({
  difficulty,
  isSelected,
  isDisabled,
  onPress,
}: {
  difficulty: number
  isSelected: boolean
  isDisabled: boolean
  onPress: () => void
}): JSX.Element {
  return (
    <TouchableArea disabled={isDisabled} onPress={onPress}>
      <Flex
        backgroundColor={isSelected ? '$accent1' : '$surface3'}
        px="$spacing12"
        py="$spacing8"
        borderRadius="$rounded8"
        opacity={isDisabled ? 0.5 : 1}
      >
        <Text variant="body2" color={isSelected ? '$white' : '$neutral1'}>
          {difficulty}
        </Text>
      </Flex>
    </TouchableArea>
  )
})

// Memoized implementation selector button
const ImplButton = memo(function ImplButton({
  impl,
  isSelected,
  isDisabled,
  onPress,
}: {
  impl: { value: Implementation; label: string }
  isSelected: boolean
  isDisabled: boolean
  onPress: () => void
}): JSX.Element {
  return (
    <TouchableArea disabled={isDisabled} onPress={onPress}>
      <Flex
        backgroundColor={isSelected ? '$accent1' : '$surface3'}
        px="$spacing12"
        py="$spacing8"
        borderRadius="$rounded8"
        opacity={isDisabled ? 0.5 : 1}
      >
        <Text variant="body2" color={isSelected ? '$white' : '$neutral1'}>
          {impl.label}
        </Text>
      </Flex>
    </TouchableArea>
  )
})

/**
 * Benchmark screen for comparing native vs JS hashcash performance.
 * Access via Dev menu in development builds.
 */
// eslint-disable-next-line import/no-unused-modules -- dynamically loaded in navigation.tsx via require()
export function HashcashBenchmarkScreen(): JSX.Element {
  // Individual selectors for minimal re-renders
  const selectedDifficulty = useHashcashBenchmarkStore((state) => state.selectedDifficulty)
  const selectedImpl = useHashcashBenchmarkStore((state) => state.selectedImpl)
  const results = useHashcashBenchmarkStore((state) => state.results)
  const isRunning = useHashcashBenchmarkStore((state) => state.progress.isRunning)
  const progressStartTime = useHashcashBenchmarkStore((state) => state.progress.startTime)
  const measuredHashRate = useHashcashBenchmarkStore((state) => state.measuredHashRate)

  // Actions (stable references)
  const setDifficulty = useHashcashBenchmarkStore((state) => state.setDifficulty)
  const setImpl = useHashcashBenchmarkStore((state) => state.setImpl)
  const addResult = useHashcashBenchmarkStore((state) => state.addResult)
  const clearResults = useHashcashBenchmarkStore((state) => state.clearResults)
  const addLog = useHashcashBenchmarkStore((state) => state.addLog)
  const startBenchmark = useHashcashBenchmarkStore((state) => state.startBenchmark)
  const updateProgress = useHashcashBenchmarkStore((state) => state.updateProgress)
  const endBenchmark = useHashcashBenchmarkStore((state) => state.endBenchmark)
  const cancel = useHashcashBenchmarkStore((state) => state.cancel)
  const resetCancel = useHashcashBenchmarkStore((state) => state.resetCancel)

  // Progress timer - only runs for native benchmarks (JS blocks the thread)
  useEffect(() => {
    if (isRunning && progressStartTime !== null) {
      const interval = setInterval(() => {
        const elapsed = performance.now() - progressStartTime
        // Use measured hash rate if available, otherwise estimate 900k for native
        const hashRate = measuredHashRate ?? 900000
        const estimated = Math.floor((elapsed / 1000) * hashRate)
        updateProgress(elapsed, estimated)
      }, 100)

      return (): void => {
        clearInterval(interval)
      }
    }
    return undefined
  }, [isRunning, progressStartTime, measuredHashRate, updateProgress])

  const runNativeBenchmark = useCallback(async (difficulty: number): Promise<BenchmarkResult | null> => {
    if (useHashcashBenchmarkStore.getState().isCancelled) {
      return null
    }

    const challenge = {
      difficulty,
      subject: 'Benchmark',
      nonce: 'dGVzdC1ub25jZS1iZW5jaG1hcms=',
      maxProofLength: 10_000_000,
    }

    const startTime = performance.now()
    const result = await HashcashNative.findProof({ challenge })
    const endTime = performance.now()
    const timeMs = endTime - startTime

    if (useHashcashBenchmarkStore.getState().isCancelled) {
      return null
    }

    const attempts = result?.attempts ?? 0
    const hashRate = timeMs > 0 ? Math.round((attempts / timeMs) * 1000) : 0

    logger.debug(
      'HashcashBenchmark',
      'runNativeBenchmark',
      `Native result: difficulty=${difficulty}, attempts=${attempts}, timeMs=${timeMs.toFixed(2)}, hashRate=${hashRate}, hasResult=${!!result}`,
    )

    return {
      implementation: 'native',
      difficulty,
      counter: result?.counter ?? null,
      attempts,
      timeMs,
      hashRate,
    }
  }, [])

  const runJSBenchmark = useCallback(async (difficulty: number): Promise<BenchmarkResult | null> => {
    if (useHashcashBenchmarkStore.getState().isCancelled) {
      return null
    }

    const challenge = {
      difficulty,
      subject: 'Benchmark',
      algorithm: 'sha256' as const,
      nonce: 'dGVzdC1ub25jZS1iZW5jaG1hcms=',
      max_proof_length: 10_000_000,
    }

    const startTime = performance.now()
    // findProof is async (throws NotImplementedError on native - mobile uses Nitro modules)
    const result = await jsFindProof({ challenge })
    const endTime = performance.now()
    const timeMs = endTime - startTime

    if (useHashcashBenchmarkStore.getState().isCancelled) {
      return null
    }

    const attempts = result?.attempts ?? 0
    const hashRate = timeMs > 0 ? Math.round((attempts / timeMs) * 1000) : 0

    return {
      implementation: 'js',
      difficulty,
      counter: result?.counter ?? null,
      attempts,
      timeMs,
      hashRate,
    }
  }, [])

  const runBenchmark = useCallback(async (): Promise<void> => {
    resetCancel()
    const difficulty = useHashcashBenchmarkStore.getState().selectedDifficulty
    const impl = useHashcashBenchmarkStore.getState().selectedImpl

    addLog(`Benchmark started (difficulty=${difficulty}, impl=${impl})`)

    try {
      // Run native if requested
      if ((impl === 'both' || impl === 'native') && !useHashcashBenchmarkStore.getState().isCancelled) {
        startBenchmark('native', difficulty)
        addLog(`Running Native (difficulty=${difficulty})...`)

        const nativeResult = await runNativeBenchmark(difficulty)
        if (nativeResult && !useHashcashBenchmarkStore.getState().isCancelled) {
          addResult(nativeResult)
          addLog(
            `Native completed: ${formatDuration(nativeResult.timeMs)}, ${nativeResult.attempts.toLocaleString()} attempts`,
            'success',
          )
        }
      }

      // Run JS if requested
      if ((impl === 'both' || impl === 'js') && !useHashcashBenchmarkStore.getState().isCancelled) {
        startBenchmark('js', difficulty)
        addLog(`Running JavaScript (blocks UI during computation)...`)

        // Wait for React to render the progress card before blocking the thread
        await waitForPaint()

        const jsResult = await runJSBenchmark(difficulty)
        if (jsResult && !useHashcashBenchmarkStore.getState().isCancelled) {
          addResult(jsResult)
          addLog(
            `JavaScript completed: ${formatDuration(jsResult.timeMs)}, ${jsResult.attempts.toLocaleString()} attempts`,
            'success',
          )
        }
      }

      if (!useHashcashBenchmarkStore.getState().isCancelled) {
        addLog('Benchmark completed', 'success')
      }
    } catch (error) {
      addLog(`Benchmark failed: ${error}`, 'error')
      logger.error(error, { tags: { file: 'HashcashBenchmarkScreen', function: 'runBenchmark' } })
    } finally {
      endBenchmark()
    }
  }, [resetCancel, addLog, startBenchmark, runNativeBenchmark, runJSBenchmark, addResult, endBenchmark])

  const handleCancel = useCallback((): void => {
    cancel()
    HashcashNative.cancel()
    addLog('Benchmark cancelled', 'info')
  }, [cancel, addLog])

  const handleClearResults = useCallback((): void => {
    clearResults()
    addLog('Results cleared', 'info')
  }, [clearResults, addLog])

  // Group results by difficulty for comparison
  const groupedResults = useMemo(() => {
    return results.reduce(
      (acc, result) => {
        if (!acc[result.difficulty]) {
          acc[result.difficulty] = {}
        }
        // biome-ignore lint/style/noNonNullAssertion: we just initialized this above
        acc[result.difficulty]![result.implementation] = result
        return acc
      },
      {} as Record<number, Partial<Record<'native' | 'js', BenchmarkResult>>>,
    )
  }, [results])

  return (
    <Screen edges={['top']}>
      <Flex row justifyContent="flex-start" px="$spacing16" py="$spacing12">
        <BackButton />
      </Flex>
      <ScrollView>
        <Flex p="$spacing16" gap="$spacing16">
          <Text variant="heading2">Hashcash Benchmark</Text>
          <Text variant="body2" color="$neutral2">
            Compare native (Swift/Kotlin) vs JavaScript hashcash performance.
          </Text>

          {/* Benchmark Controls */}
          <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing12">
            <Text variant="subheading1">Benchmark Controls</Text>

            {/* Difficulty Selection */}
            <Flex gap="$spacing4">
              <Text variant="body2" color="$neutral2">
                Difficulty:
              </Text>
              <Flex row gap="$spacing8" flexWrap="wrap">
                {DIFFICULTIES.map((d) => (
                  <DifficultyButton
                    key={d}
                    difficulty={d}
                    isSelected={selectedDifficulty === d}
                    isDisabled={isRunning}
                    onPress={() => setDifficulty(d)}
                  />
                ))}
              </Flex>
            </Flex>

            {/* Implementation Selection */}
            <Flex gap="$spacing4">
              <Text variant="body2" color="$neutral2">
                Implementation:
              </Text>
              <Flex row gap="$spacing8">
                {IMPLEMENTATIONS.map((impl) => (
                  <ImplButton
                    key={impl.value}
                    impl={impl}
                    isSelected={selectedImpl === impl.value}
                    isDisabled={isRunning}
                    onPress={() => setImpl(impl.value)}
                  />
                ))}
              </Flex>
            </Flex>

            {/* Action Buttons */}
            <Flex row gap="$spacing8" flexWrap="wrap">
              <Button size="small" emphasis="primary" isDisabled={isRunning} onPress={runBenchmark}>
                Run Benchmark
              </Button>
              {isRunning && (
                <Button size="small" emphasis="tertiary" onPress={handleCancel}>
                  Cancel
                </Button>
              )}
              <Button size="small" emphasis="secondary" isDisabled={isRunning} onPress={handleClearResults}>
                Clear Results
              </Button>
            </Flex>
          </Flex>

          {/* Current Progress */}
          <ProgressSection />

          {/* Results */}
          {Object.entries(groupedResults).map(([difficulty, impls]) => (
            <ResultCard key={difficulty} difficulty={difficulty} native={impls.native} js={impls.js} />
          ))}

          {/* Empty State */}
          {results.length === 0 && !isRunning && (
            <Flex backgroundColor="$surface2" p="$spacing24" borderRadius="$rounded16" alignItems="center">
              <Text variant="body2" color="$neutral2" textAlign="center">
                Select difficulty and implementation, then run a benchmark.
              </Text>
            </Flex>
          )}

          {/* Operation Log */}
          <LogSection />
        </Flex>
      </ScrollView>
    </Screen>
  )
}
