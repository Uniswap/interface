import { useEffect, useRef } from 'react'

interface UseCeilingRecapParams {
  /** The highest legal bid price, once the ceiling has resolved. */
  maxValidBidQ96: bigint | undefined
  /** The max-valuation field's current price. */
  tokenValueQ96: bigint | undefined
  /** That same value as the field's display string, to feed back through the write path. */
  tokenValue: string
  /** The field's clamping write path. Must not record the write as user input. */
  onRecap: (tokenValue: string) => void
}

/**
 * Re-applies the ceiling to a value that was entered before the ceiling existed.
 *
 * The ceiling arrives with the VerifyWallet response, so anything typed or clicked in the
 * meantime was capped against `undefined` — a no-op. Nothing downstream corrects it either:
 * the ceiling-dependent effect only re-snaps in fiat mode, and every write path into this
 * field suppresses the next blur snap, so blur early-returns. Left alone the field keeps
 * showing an amount the bid will not use.
 *
 * Fires only on the transition, and only when the current value is actually over the
 * ceiling, so a legal value is never pushed back through the write path for nothing.
 */
export function useCeilingRecap({ maxValidBidQ96, tokenValueQ96, tokenValue, onRecap }: UseCeilingRecapParams): void {
  const appliedRef = useRef<bigint | undefined>(undefined)

  useEffect(() => {
    if (maxValidBidQ96 === appliedRef.current) {
      return
    }
    appliedRef.current = maxValidBidQ96

    if (maxValidBidQ96 === undefined || tokenValueQ96 === undefined || !tokenValue) {
      return
    }
    if (tokenValueQ96 > maxValidBidQ96) {
      onRecap(tokenValue)
    }
  }, [maxValidBidQ96, tokenValueQ96, tokenValue, onRecap])
}
