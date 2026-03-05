/* eslint-disable max-lines */
import { createHashcashMultiWorkerChannel, createHashcashWorkerChannel } from '@universe/sessions'
import { findProof as jsFindProof } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import { memo, useCallback, useEffect, useMemo } from 'react'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import {
  type BenchmarkResult,
  type Implementation,
  type LogEntry,
  useHashcashBenchmarkStore,
} from 'src/app/features/settings/stores/hashcashBenchmarkStore'
import { Button, Flex, ScrollView, Text, TouchableArea } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { useShallow } from 'zustand/shallow'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

const DIFFICULTIES = [1, 2, 3, 4, 5]

/**
 * Calculate max_proof_length based on difficulty.
 * For difficulty N (N zero bytes = N*8 bits), expected attempts = 2^(N*8).
 * We provide 4x expected attempts for ~98% probability of finding a proof.
 */
const getMaxProofLength = (difficulty: number): number => {
  // 2^(difficulty * 8) gives expected attempts
  // Multiply by 4 for high probability of success
  const expectedAttempts = Math.pow(2, difficulty * 8)
  // Cap at a reasonable maximum to prevent infinite searches
  return Math.min(expectedAttempts * 4, 20_000_000_000)
}

/**
 * Wait for React to render and the browser to paint.
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
  { value: 'all', label: 'All' },
  { value: 'multi-worker', label: 'Multi-Worker' },
  { value: 'worker', label: 'Worker' },
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
    <TouchableArea onPress={onPress} disabled={isDisabled}>
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
    <TouchableArea onPress={onPress} disabled={isDisabled}>
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

// Memoized log entry component
const LogEntryRow = memo(function LogEntryRow({ log, index }: { log: LogEntry; index: number }): JSX.Element {
  return (
    <Text
      key={`${log.timestamp.getTime()}-${index}`}
      variant="body3"
      color={log.type === 'error' ? '$statusCritical' : log.type === 'success' ? '$statusSuccess' : '$neutral2'}
    >
      {formatTime(log.timestamp)} - {log.message}
    </Text>
  )
})

// Memoized result card component
const ResultCard = memo(function ResultCard({
  difficulty,
  multiWorker,
  worker,
  js,
}: {
  difficulty: string
  multiWorker: BenchmarkResult | undefined
  worker: BenchmarkResult | undefined
  js: BenchmarkResult | undefined
}): JSX.Element {
  // Calculate speedups
  const multiWorkerVsJs = multiWorker && js ? js.timeMs / multiWorker.timeMs : null
  const workerVsJs = worker && js ? js.timeMs / worker.timeMs : null
  const multiWorkerVsWorker = multiWorker && worker ? worker.timeMs / multiWorker.timeMs : null

  return (
    <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing12">
      <Text variant="subheading1">Difficulty {difficulty}</Text>

      {multiWorker && (
        <Flex gap="$spacing4">
          <Flex row justifyContent="space-between">
            <Text variant="body2" fontWeight="600" color="$accent1">
              Multi-Worker
            </Text>
            <Text variant="body3" color="$neutral2">
              {formatDuration(multiWorker.timeMs)}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              Attempts:
            </Text>
            <Text variant="body3" color="$neutral1">
              {multiWorker.attempts.toLocaleString()}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              Hash Rate:
            </Text>
            <Text variant="body3" color="$neutral1">
              {multiWorker.hashRate.toLocaleString()} h/s
            </Text>
          </Flex>
        </Flex>
      )}

      {worker && (
        <Flex gap="$spacing4">
          <Flex row justifyContent="space-between">
            <Text variant="body2" fontWeight="600" color="$statusSuccess">
              Single Worker
            </Text>
            <Text variant="body3" color="$neutral2">
              {formatDuration(worker.timeMs)}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              Attempts:
            </Text>
            <Text variant="body3" color="$neutral1">
              {worker.attempts.toLocaleString()}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              Hash Rate:
            </Text>
            <Text variant="body3" color="$neutral1">
              {worker.hashRate.toLocaleString()} h/s
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

      {/* Speedup comparisons */}
      <Flex gap="$spacing4">
        {multiWorkerVsJs && (
          <Flex backgroundColor="$surface3" p="$spacing8" borderRadius="$rounded8">
            <Text variant="body2" fontWeight="bold" color="$accent1" textAlign="center">
              Multi-Worker is {multiWorkerVsJs.toFixed(1)}x faster than JS
            </Text>
          </Flex>
        )}
        {multiWorkerVsWorker && (
          <Flex backgroundColor="$surface3" p="$spacing8" borderRadius="$rounded8">
            <Text variant="body2" fontWeight="bold" color="$statusSuccess" textAlign="center">
              Multi-Worker is {multiWorkerVsWorker.toFixed(1)}x faster than Single Worker
            </Text>
          </Flex>
        )}
        {workerVsJs && !multiWorkerVsJs && (
          <Flex backgroundColor="$surface3" p="$spacing8" borderRadius="$rounded8">
            <Text
              variant="body2"
              fontWeight="bold"
              color={workerVsJs > 1 ? '$statusSuccess' : '$statusCritical'}
              textAlign="center"
            >
              {workerVsJs > 1
                ? `Worker is ${workerVsJs.toFixed(1)}x faster than JS`
                : `JS is ${(1 / workerVsJs).toFixed(1)}x faster`}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
})

// Progress section - only re-renders when progress changes
const ProgressSection = memo(function ProgressSection(): JSX.Element | null {
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
          {progress.currentImpl === 'multi-worker'
            ? 'Multi-Worker'
            : progress.currentImpl === 'worker'
              ? 'Single Worker'
              : 'JavaScript'}{' '}
          @ Difficulty {progress.difficulty}
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

// Operation log section
const LogSection = memo(function LogSection(): JSX.Element | null {
  const logs = useHashcashBenchmarkStore((state) => state.logs)
  const clearLogs = useHashcashBenchmarkStore((state) => state.clearLogs)

  if (logs.length === 0) {
    return null
  }

  return (
    <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing8">
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="subheading1">Operation Log</Text>
        <TouchableArea onPress={clearLogs}>
          <Text variant="body3" color="$neutral3">
            Clear
          </Text>
        </TouchableArea>
      </Flex>

      {logs.map((log, index) => (
        <LogEntryRow key={`${log.timestamp.getTime()}-${index}`} log={log} index={index} />
      ))}
    </Flex>
  )
})

/**
 * Benchmark screen for comparing Web Worker vs JavaScript hashcash performance.
 * Access via Dev menu in development builds.
 */
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

  // Progress timer - only runs for worker benchmarks (JS blocks the thread)
  useEffect(() => {
    if (isRunning && progressStartTime !== null) {
      const interval = setInterval(() => {
        const elapsed = performance.now() - progressStartTime
        // Use measured hash rate if available, otherwise estimate 500k for worker
        const hashRate = measuredHashRate ?? 500000
        const estimated = Math.floor((elapsed / 1000) * hashRate)
        updateProgress(elapsed, estimated)
      }, 100)

      return (): void => {
        clearInterval(interval)
      }
    }
    return undefined
  }, [isRunning, progressStartTime, measuredHashRate, updateProgress])

  const runWorkerBenchmark = useCallback(async (difficulty: number): Promise<BenchmarkResult | null> => {
    if (useHashcashBenchmarkStore.getState().isCancelled) {
      return null
    }

    const challenge = {
      difficulty,
      subject: 'Benchmark',
      algorithm: 'sha256' as const,
      nonce: 'dGVzdC1ub25jZS1iZW5jaG1hcms=',
      max_proof_length: getMaxProofLength(difficulty),
    }

    const channel = createHashcashWorkerChannel({
      getWorker: () =>
        new Worker(
          new URL('@universe/sessions/src/challenge-solvers/hashcash/worker/hashcash.worker.ts', import.meta.url),
          { type: 'module' },
        ),
    })

    try {
      const startTime = performance.now()
      const result = await channel.api.findProof({ challenge })
      const endTime = performance.now()
      const timeMs = endTime - startTime

      if (useHashcashBenchmarkStore.getState().isCancelled) {
        return null
      }

      const attempts = result?.attempts ?? 0
      const hashRate = timeMs > 0 ? Math.round((attempts / timeMs) * 1000) : 0

      logger.debug(
        'HashcashBenchmark',
        'runWorkerBenchmark',
        `Worker result: difficulty=${difficulty}, attempts=${attempts}, timeMs=${timeMs.toFixed(2)}, hashRate=${hashRate}, hasResult=${!!result}`,
      )

      return {
        implementation: 'worker',
        difficulty,
        counter: result?.counter ?? null,
        attempts,
        timeMs,
        hashRate,
      }
    } finally {
      channel.terminate()
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
      max_proof_length: getMaxProofLength(difficulty),
    }

    const startTime = performance.now()
    // findProof is async (uses Web Crypto)
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

  const runMultiWorkerBenchmark = useCallback(async (difficulty: number): Promise<BenchmarkResult | null> => {
    if (useHashcashBenchmarkStore.getState().isCancelled) {
      return null
    }

    const challenge = {
      difficulty,
      subject: 'Benchmark',
      algorithm: 'sha256' as const,
      nonce: 'dGVzdC1ub25jZS1iZW5jaG1hcms=',
      max_proof_length: getMaxProofLength(difficulty),
    }

    const workerCount = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4
    const channel = createHashcashMultiWorkerChannel({
      workerCount,
      getWorker: () =>
        new Worker(
          new URL('@universe/sessions/src/challenge-solvers/hashcash/worker/hashcash.worker.ts', import.meta.url),
          { type: 'module' },
        ),
    })

    try {
      const startTime = performance.now()
      const result = await channel.api.findProof({ challenge })
      const endTime = performance.now()
      const timeMs = endTime - startTime

      if (useHashcashBenchmarkStore.getState().isCancelled) {
        return null
      }

      const attempts = result?.attempts ?? 0
      const hashRate = timeMs > 0 ? Math.round((attempts / timeMs) * 1000) : 0

      logger.debug(
        'HashcashBenchmark',
        'runMultiWorkerBenchmark',
        `Multi-worker result: difficulty=${difficulty}, workers=${workerCount}, attempts=${attempts}, timeMs=${timeMs.toFixed(2)}, hashRate=${hashRate}, hasResult=${!!result}`,
      )

      return {
        implementation: 'multi-worker',
        difficulty,
        counter: result?.counter ?? null,
        attempts,
        timeMs,
        hashRate,
      }
    } finally {
      channel.terminate()
    }
  }, [])

  const runBenchmark = useCallback(async (): Promise<void> => {
    resetCancel()
    const difficulty = useHashcashBenchmarkStore.getState().selectedDifficulty
    const impl = useHashcashBenchmarkStore.getState().selectedImpl

    addLog(`Benchmark started (difficulty=${difficulty}, impl=${impl})`)

    try {
      // Run multi-worker if requested
      if ((impl === 'all' || impl === 'multi-worker') && !useHashcashBenchmarkStore.getState().isCancelled) {
        const workerCount = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4
        startBenchmark('multi-worker', difficulty)
        addLog(`Running Multi-Worker (${workerCount} workers, difficulty=${difficulty})...`)

        const multiWorkerResult = await runMultiWorkerBenchmark(difficulty)
        if (multiWorkerResult && !useHashcashBenchmarkStore.getState().isCancelled) {
          addResult(multiWorkerResult)
          addLog(
            `Multi-Worker completed: ${formatDuration(multiWorkerResult.timeMs)}, ${multiWorkerResult.attempts.toLocaleString()} attempts`,
            'success',
          )
        }
      }

      // Run single worker if requested
      if ((impl === 'all' || impl === 'worker') && !useHashcashBenchmarkStore.getState().isCancelled) {
        startBenchmark('worker', difficulty)
        addLog(`Running Single Worker (difficulty=${difficulty})...`)

        const workerResult = await runWorkerBenchmark(difficulty)
        if (workerResult && !useHashcashBenchmarkStore.getState().isCancelled) {
          addResult(workerResult)
          addLog(
            `Single Worker completed: ${formatDuration(workerResult.timeMs)}, ${workerResult.attempts.toLocaleString()} attempts`,
            'success',
          )
        }
      }

      // Run JS if requested
      if ((impl === 'all' || impl === 'js') && !useHashcashBenchmarkStore.getState().isCancelled) {
        startBenchmark('js', difficulty)
        addLog(`Running JavaScript (uses Web Crypto)...`)

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
  }, [
    resetCancel,
    addLog,
    startBenchmark,
    runMultiWorkerBenchmark,
    runWorkerBenchmark,
    runJSBenchmark,
    addResult,
    endBenchmark,
  ])

  const handleCancel = useCallback((): void => {
    cancel()
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
      {} as Record<number, Partial<Record<'multi-worker' | 'worker' | 'js', BenchmarkResult>>>,
    )
  }, [results])

  return (
    <ScrollView>
      <ScreenHeader title="Hashcash Benchmark" />

      <Flex p="$spacing16" gap="$spacing16">
        <Text variant="body2" color="$neutral2">
          Compare Multi-Worker, Single Worker, and JavaScript hashcash performance with Web Crypto.
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
          <ResultCard
            key={difficulty}
            difficulty={difficulty}
            multiWorker={impls['multi-worker']}
            worker={impls.worker}
            js={impls.js}
          />
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
  )
}
