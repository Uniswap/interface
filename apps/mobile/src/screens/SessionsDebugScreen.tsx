import { getEntryGatewayUrl, provideSessionService } from '@universe/api'
import { getStorageDriver } from '@universe/api/src/storage/getStorageDriver'
import { ChallengeType, createHashcashSolver, type SessionService } from '@universe/sessions'
import React, { useCallback, useEffect, useRef } from 'react'
import { ScrollView } from 'react-native'
import { BackButton } from 'src/components/buttons/BackButton'
import { Screen } from 'src/components/layout/Screen'
import { createHashcashWorkerChannel } from 'src/features/sessions/createHashcashWorkerChannel'
import { CurrentOperationSection } from 'src/screens/components/sessions/CurrentOperationSection'
import { HashcashProgressSection } from 'src/screens/components/sessions/HashcashProgressSection'
import { LogSection } from 'src/screens/components/sessions/LogSection'
import { useSessionsDebugStore } from 'src/screens/stores/sessionsDebugStore'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { logger } from 'utilities/src/logger/logger'
import { useShallow } from 'zustand/shallow'

// Storage keys (must match provideSessionStorage, provideDeviceIdService, provideUniswapIdentifierService)
const SESSION_ID_KEY = 'UNISWAP_SESSION_ID'
const DEVICE_ID_KEY = 'UNISWAP_DEVICE_ID'
const UNISWAP_IDENTIFIER_KEY = 'UNISWAP_IDENTIFIER'

function truncateId(id: string | null, length = 16): string {
  if (!id) {
    return 'None'
  }
  if (id.length <= length) {
    return id
  }
  return `${id.slice(0, length)}...`
}

/**
 * Sessions Debug Screen for testing session initialization flow.
 * Access via Dev menu in development builds.
 */
// eslint-disable-next-line import/no-unused-modules -- dynamically loaded in navigation.tsx via require()
export function SessionsDebugScreen(): JSX.Element {
  // Individual selectors for minimal re-renders
  const session = useSessionsDebugStore(
    useShallow((state) => ({
      sessionId: state.session.sessionId,
      deviceId: state.session.deviceId,
      uniswapIdentifier: state.session.uniswapIdentifier,
    })),
  )
  const challenge = useSessionsDebugStore((state) => state.challenge)
  const isLoading = useSessionsDebugStore((state) => state.isLoading)
  const hashcashIsRunning = useSessionsDebugStore((state) => state.hashcashProgress.isRunning)
  const hashcashStartTime = useSessionsDebugStore((state) => state.hashcashProgress.startTime)

  // Actions (stable references)
  const setSession = useSessionsDebugStore((state) => state.setSession)
  const setChallenge = useSessionsDebugStore((state) => state.setChallenge)
  const startOperation = useSessionsDebugStore((state) => state.startOperation)
  const endOperation = useSessionsDebugStore((state) => state.endOperation)
  const addLog = useSessionsDebugStore((state) => state.addLog)
  const startHashcash = useSessionsDebugStore((state) => state.startHashcash)
  const updateHashcashProgress = useSessionsDebugStore((state) => state.updateHashcashProgress)
  const completeHashcash = useSessionsDebugStore((state) => state.completeHashcash)
  const stopHashcash = useSessionsDebugStore((state) => state.stopHashcash)
  const reset = useSessionsDebugStore((state) => state.reset)

  const sessionServiceRef = useRef<SessionService | null>(null)

  const getSessionService = useCallback((): SessionService => {
    if (!sessionServiceRef.current) {
      sessionServiceRef.current = provideSessionService({
        getBaseUrl: getEntryGatewayUrl,
        getIsSessionServiceEnabled: () => true, // Always enabled for debug
        getLogger: () => logger,
      })
    }
    return sessionServiceRef.current
  }, [])

  const refreshSessionState = useCallback(async (): Promise<void> => {
    const driver = getStorageDriver()
    const [sessionId, deviceId, uniswapIdentifier] = await Promise.all([
      driver.get(SESSION_ID_KEY),
      driver.get(DEVICE_ID_KEY),
      driver.get(UNISWAP_IDENTIFIER_KEY),
    ])
    setSession({
      sessionId: sessionId || null,
      deviceId: deviceId || null,
      uniswapIdentifier: uniswapIdentifier || null,
    })
  }, [setSession])

  // Initial load - only run once on mount
  useEffect(() => {
    const loadInitialState = async (): Promise<void> => {
      const driver = getStorageDriver()
      const [sessionId, deviceId, uniswapIdentifier] = await Promise.all([
        driver.get(SESSION_ID_KEY),
        driver.get(DEVICE_ID_KEY),
        driver.get(UNISWAP_IDENTIFIER_KEY),
      ])
      setSession({
        sessionId: sessionId || null,
        deviceId: deviceId || null,
        uniswapIdentifier: uniswapIdentifier || null,
      })
    }
    loadInitialState().catch(() => undefined)
  }, [setSession])

  // Progress timer for hashcash
  useEffect(() => {
    if (hashcashIsRunning && hashcashStartTime !== null) {
      const interval = setInterval(() => {
        const elapsed = performance.now() - hashcashStartTime
        // Estimate ~900k hashes/sec on native
        const estimatedAttempts = Math.floor((elapsed / 1000) * 900000)
        updateHashcashProgress(elapsed, estimatedAttempts)
      }, 100)

      return (): void => {
        clearInterval(interval)
      }
    }
    return undefined
  }, [hashcashIsRunning, hashcashStartTime, updateHashcashProgress])

  const clearAllState = useCallback(async (): Promise<void> => {
    startOperation('Clearing all state...')
    try {
      const driver = getStorageDriver()
      await Promise.all([
        driver.remove(SESSION_ID_KEY),
        driver.remove(DEVICE_ID_KEY),
        driver.remove(UNISWAP_IDENTIFIER_KEY),
      ])
      // Reset the session service ref so a fresh one is created next time
      sessionServiceRef.current = null
      setChallenge(null)
      reset()
      addLog('Cleared all session state', 'success')
      await refreshSessionState()
    } catch (error) {
      addLog(`Failed to clear state: ${error}`, 'error')
      logger.error(error, { tags: { file: 'SessionsDebugScreen', function: 'clearAllState' } })
    } finally {
      endOperation()
    }
  }, [startOperation, setChallenge, reset, addLog, refreshSessionState, endOperation])

  const handleInitSession = useCallback(async (): Promise<void> => {
    startOperation('Initializing session...')
    addLog('Init session started')
    try {
      const service = getSessionService()
      const result = await service.initSession()
      addLog(`Session initialized. needChallenge: ${result.needChallenge}`, 'success')
      if (result.sessionId) {
        addLog(`Session ID: ${truncateId(result.sessionId)}`)
      }
      await refreshSessionState()
    } catch (error) {
      addLog(`Init session failed: ${error}`, 'error')
      logger.error(error, { tags: { file: 'SessionsDebugScreen', function: 'handleInitSession' } })
    } finally {
      endOperation()
    }
  }, [startOperation, addLog, getSessionService, refreshSessionState, endOperation])

  const handleRequestChallenge = useCallback(async (): Promise<void> => {
    startOperation('Requesting challenge...')
    addLog('Request challenge started')
    try {
      const service = getSessionService()
      const challengeResult = await service.requestChallenge()
      setChallenge(challengeResult)
      const challengeTypeName = ChallengeType[challengeResult.challengeType] || 'Unknown'
      addLog(`Challenge received: ${challengeTypeName}`, 'success')
      addLog(`Challenge ID: ${truncateId(challengeResult.challengeId)}`)

      // Parse difficulty from extra if hashcash
      if (challengeResult.challengeType === ChallengeType.HASHCASH && challengeResult.extra['challengeData']) {
        try {
          const challengeData = JSON.parse(challengeResult.extra['challengeData'])
          addLog(`Difficulty: ${challengeData.difficulty}`)
        } catch {
          // Ignore parse errors
        }
      }
    } catch (error) {
      addLog(`Request challenge failed: ${error}`, 'error')
      logger.error(error, { tags: { file: 'SessionsDebugScreen', function: 'handleRequestChallenge' } })
    } finally {
      endOperation()
    }
  }, [startOperation, addLog, getSessionService, setChallenge, endOperation])

  const handleSolveChallenge = useCallback(async (): Promise<void> => {
    const currentChallenge = useSessionsDebugStore.getState().challenge
    if (!currentChallenge) {
      addLog('No challenge to solve. Request a challenge first.', 'error')
      return
    }

    if (currentChallenge.challengeType !== ChallengeType.HASHCASH) {
      addLog('Only Hashcash challenges are supported on mobile', 'error')
      return
    }

    startOperation('Solving hashcash challenge...')
    addLog('Hashcash solve started')

    // Parse difficulty for progress display
    let difficulty = 0
    if (currentChallenge.extra['challengeData']) {
      try {
        const challengeData = JSON.parse(currentChallenge.extra['challengeData'])
        difficulty = challengeData.difficulty || 0
      } catch {
        // Use default
      }
    }

    // Start progress tracking
    startHashcash(difficulty)

    try {
      const solver = createHashcashSolver({
        performanceTracker: {
          now: () => performance.now(),
        },
        getWorkerChannel: () => createHashcashWorkerChannel(),
        onSolveCompleted: (data) => {
          completeHashcash(data)
        },
      })

      const solution = await solver.solve({
        challengeId: currentChallenge.challengeId,
        challengeType: currentChallenge.challengeType,
        extra: currentChallenge.extra,
      })

      addLog(`Challenge solved!`, 'success')
      addLog(`Solution: ${truncateId(solution, 32)}`)

      // Verify with backend
      startOperation('Verifying session...')
      addLog('Verifying session with backend...')
      const service = getSessionService()
      const verifyResult = await service.verifySession({
        solution,
        challengeId: currentChallenge.challengeId,
        challengeType: currentChallenge.challengeType,
      })

      if (verifyResult.retry) {
        addLog('Verification returned retry=true. May need another challenge.', 'info')
      } else {
        addLog('Session verified successfully!', 'success')
      }

      setChallenge(null)
      await refreshSessionState()
    } catch (error) {
      stopHashcash()
      addLog(`Solve challenge failed: ${error}`, 'error')
      logger.error(error, { tags: { file: 'SessionsDebugScreen', function: 'handleSolveChallenge' } })
    } finally {
      endOperation()
    }
  }, [
    addLog,
    startOperation,
    startHashcash,
    completeHashcash,
    getSessionService,
    setChallenge,
    refreshSessionState,
    stopHashcash,
    endOperation,
  ])

  const copyToClipboard = useCallback(
    async (value: string | null, label: string): Promise<void> => {
      if (!value) {
        return
      }
      await setClipboard(value)
      addLog(`Copied ${label} to clipboard`, 'info')
    },
    [addLog],
  )

  const hasChallenge = challenge !== null

  return (
    <Screen edges={['top']}>
      <Flex row justifyContent="flex-start" px="$spacing16" py="$spacing12">
        <BackButton />
      </Flex>
      <ScrollView>
        <Flex p="$spacing16" gap="$spacing16">
          <Text variant="heading2">Sessions Debug</Text>
          <Text variant="body2" color="$neutral2">
            Test session initialization flow step by step.
          </Text>

          {/* Session Status Section */}
          <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing12">
            <Text variant="subheading1">Session Status</Text>

            <Flex gap="$spacing8">
              <Flex row justifyContent="space-between" alignItems="center">
                <Text variant="body2" color="$neutral2">
                  Session ID:
                </Text>
                <Flex row alignItems="center" gap="$spacing4">
                  <Text variant="body3" color={session.sessionId ? '$neutral1' : '$neutral3'}>
                    {truncateId(session.sessionId)}
                  </Text>
                  {session.sessionId && (
                    <TouchableArea onPress={() => copyToClipboard(session.sessionId, 'Session ID')}>
                      <CopyAlt color="$neutral3" size="$icon.16" />
                    </TouchableArea>
                  )}
                </Flex>
              </Flex>

              <Flex row justifyContent="space-between" alignItems="center">
                <Text variant="body2" color="$neutral2">
                  Device ID:
                </Text>
                <Flex row alignItems="center" gap="$spacing4">
                  <Text variant="body3" color={session.deviceId ? '$neutral1' : '$neutral3'}>
                    {truncateId(session.deviceId)}
                  </Text>
                  {session.deviceId && (
                    <TouchableArea onPress={() => copyToClipboard(session.deviceId, 'Device ID')}>
                      <CopyAlt color="$neutral3" size="$icon.16" />
                    </TouchableArea>
                  )}
                </Flex>
              </Flex>

              <Flex row justifyContent="space-between" alignItems="center">
                <Text variant="body2" color="$neutral2">
                  Uniswap ID:
                </Text>
                <Flex row alignItems="center" gap="$spacing4">
                  <Text variant="body3" color={session.uniswapIdentifier ? '$neutral1' : '$neutral3'}>
                    {truncateId(session.uniswapIdentifier)}
                  </Text>
                  {session.uniswapIdentifier && (
                    <TouchableArea onPress={() => copyToClipboard(session.uniswapIdentifier, 'Uniswap ID')}>
                      <CopyAlt color="$neutral3" size="$icon.16" />
                    </TouchableArea>
                  )}
                </Flex>
              </Flex>

              <Flex row justifyContent="space-between" alignItems="center">
                <Text variant="body2" color="$neutral2">
                  Challenge Pending:
                </Text>
                <Text variant="body3" color={hasChallenge ? '$statusWarning' : '$neutral3'}>
                  {hasChallenge ? 'Yes' : 'No'}
                </Text>
              </Flex>
            </Flex>
          </Flex>

          {/* Action Buttons */}
          <Flex row gap="$spacing8" flexWrap="wrap">
            <Button size="small" emphasis="secondary" isDisabled={isLoading} onPress={refreshSessionState}>
              Refresh
            </Button>
            <Button size="small" emphasis="tertiary" isDisabled={isLoading} onPress={clearAllState}>
              Clear All State
            </Button>
          </Flex>

          {/* Step-by-Step Testing */}
          <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing12">
            <Text variant="subheading1">Step-by-Step Testing</Text>
            <Flex gap="$spacing8">
              <Button size="small" emphasis="primary" isDisabled={isLoading} onPress={handleInitSession}>
                1. Init Session
              </Button>
              <Button size="small" emphasis="secondary" isDisabled={isLoading} onPress={handleRequestChallenge}>
                2. Request Challenge
              </Button>
              <Button
                size="small"
                emphasis="secondary"
                isDisabled={isLoading || !hasChallenge}
                onPress={handleSolveChallenge}
              >
                3. Solve Challenge
              </Button>
            </Flex>
          </Flex>

          {/* Current Operation */}
          <CurrentOperationSection />

          {/* Hashcash Progress */}
          <HashcashProgressSection />

          {/* Operation Log */}
          <LogSection />
        </Flex>
      </ScrollView>
    </Screen>
  )
}
