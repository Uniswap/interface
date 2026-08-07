import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { getUnitagsUsernameQueryOptions } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import {
  appendRandomDigits,
  generateUnitagCandidate,
} from 'uniswap/src/features/unitags/suggestions/generateUnitagSuggestion'
import { useEvent } from 'utilities/src/react/hooks'

// Keep a few vetted-available names ready so prefill and shuffle feel instant.
const PREWARM_QUEUE_TARGET = 3
// Bound network probes per fill so a run of taken names can't spin indefinitely.
const MAX_PROBE_ATTEMPTS = 8
// After this many misses, widen the pattern / escalate to digits to keep finding open names.
const NOUN_NOUN_ESCALATION_ATTEMPT = 3
const DIGIT_ESCALATION_ATTEMPT = 6

export interface SuggestedUnitag {
  /** The current suggested username (without the .uni.eth suffix), or undefined while initializing. */
  suggestion: string | undefined
  /** True until the first available suggestion has been found. */
  isInitializing: boolean
  /** True while a shuffle is fetching a fresh suggestion (only when the vetted queue is empty). */
  isShuffling: boolean
  /** Replace the current suggestion with a different available name. */
  shuffle: () => void
}

/**
 * Generates available unitag suggestions for the embedded-wallet onboarding flow.
 *
 * Instantiate this at the flow container so pre-warming begins as early as possible (e.g. on the
 * welcome screen): on mount it finds one available name to prefill and fills a small queue of
 * vetted names in the background. `shuffle` pops the next vetted name instantly, refilling behind
 * it. Availability is probed through the shared query client so results are cached and shared with
 * the edit-field's `useCanClaimUnitagName`. On a probe/network failure it falls back to an
 * optimistic (unvetted) candidate so onboarding is never blocked.
 */
export function useSuggestedUnitag(): SuggestedUnitag {
  const queryClient = useQueryClient()
  const queueRef = useRef<string[]>([])
  // Cancellation for in-flight async work (initialize, shuffle, refills); set by the mount effect's cleanup.
  const cancelledRef = useRef(false)
  const [suggestion, setSuggestion] = useState<string>()
  const [isInitializing, setIsInitializing] = useState(true)
  const [isShuffling, setIsShuffling] = useState(false)

  // Returns true (available), false (taken), or null when availability can't be determined
  // (network/error) so callers can decide to fall back optimistically.
  const probeAvailability = useEvent(async (candidate: string): Promise<boolean | null> => {
    try {
      const response = await queryClient.fetchQuery(getUnitagsUsernameQueryOptions({ username: candidate }))
      return Boolean(response.available)
    } catch {
      return null
    }
  })

  // Finds a single available candidate, escalating the generation pattern as misses accumulate.
  // Returns an optimistic candidate on network failure, or undefined if every attempt was taken.
  const findAvailable = useEvent(async (exclude?: string): Promise<string | undefined> => {
    for (let attempt = 0; attempt < MAX_PROBE_ATTEMPTS; attempt++) {
      const allowNounNoun = attempt >= NOUN_NOUN_ESCALATION_ATTEMPT
      const base = generateUnitagCandidate({ allowNounNoun })
      const candidate = attempt >= DIGIT_ESCALATION_ATTEMPT ? appendRandomDigits(base, { digits: 1 }) : base

      if (candidate === exclude || queueRef.current.includes(candidate)) {
        continue
      }

      const available = await probeAvailability(candidate)
      if (available === null || available) {
        return candidate
      }
    }
    return undefined
  })

  // `exclude` is passed explicitly because callers refill right after setSuggestion, when the
  // committed `suggestion` state is still the previous value and would not exclude the new one.
  const refillQueue = useEvent(
    async ({ exclude, shouldStop }: { exclude: string | undefined; shouldStop?: () => boolean }): Promise<void> => {
      while (queueRef.current.length < PREWARM_QUEUE_TARGET) {
        if (shouldStop?.()) {
          return
        }
        const next = await findAvailable(exclude)
        if (shouldStop?.()) {
          return
        }
        if (!next || next === exclude || queueRef.current.includes(next)) {
          break
        }
        queueRef.current.push(next)
      }
    },
  )

  const initialize = useEvent(async (shouldStop: () => boolean): Promise<void> => {
    const first = await findAvailable()
    if (shouldStop()) {
      return
    }
    if (first) {
      setSuggestion(first)
    }
    setIsInitializing(false)
    await refillQueue({ exclude: first, shouldStop })
  })

  useEffect(() => {
    cancelledRef.current = false
    queueRef.current = []
    setIsInitializing(true)
    void initialize(() => cancelledRef.current)
    return () => {
      cancelledRef.current = true
    }
  }, [initialize])

  const shuffle = useEvent((): void => {
    const readyIndex = queueRef.current.findIndex((name) => name !== suggestion)
    if (readyIndex >= 0) {
      const [next] = queueRef.current.splice(readyIndex, 1)
      setSuggestion(next)
      void refillQueue({ exclude: next, shouldStop: () => cancelledRef.current })
      return
    }

    setIsShuffling(true)
    void (async () => {
      const next = await findAvailable(suggestion)
      if (cancelledRef.current) {
        return
      }
      if (next) {
        setSuggestion(next)
      }
      setIsShuffling(false)
      void refillQueue({ exclude: next ?? suggestion, shouldStop: () => cancelledRef.current })
    })()
  })

  return { suggestion, isInitializing, isShuffling, shuffle }
}
