import type { Currency } from '@uniswap/sdk-core'
import { useCallback, useRef } from 'react'

interface UserPreservedCurrencies {
  inputCurrency: Currency | undefined
  outputCurrency: Currency | undefined
  /** Call when the user manually changes tokens in the swap widget. */
  markInteracted: () => void
}

/**
 * Preserves swap currencies once the user has manually selected a token, preventing auto-updates
 * from overriding their choice. Resets naturally when the component remounts (e.g., navigation).
 */
export function useUserPreservedCurrencies(
  computedInputCurrency: Currency | undefined,
  computedOutputCurrency: Currency | undefined,
): UserPreservedCurrencies {
  const hasUserInteractedRef = useRef(false)
  const frozenInputRef = useRef<Currency | undefined>(undefined)
  const frozenOutputRef = useRef<Currency | undefined>(undefined)

  // When user hasn't interacted, track the latest computed values.
  // When they have, refs freeze so <Swap> props stay stable.
  if (!hasUserInteractedRef.current) {
    frozenInputRef.current = computedInputCurrency
    frozenOutputRef.current = computedOutputCurrency
  }

  const markInteracted = useCallback((): void => {
    hasUserInteractedRef.current = true
  }, [])

  return {
    inputCurrency: frozenInputRef.current,
    outputCurrency: frozenOutputRef.current,
    markInteracted,
  }
}
